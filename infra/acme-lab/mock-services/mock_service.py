from __future__ import annotations

import json
import os
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

SERVICE_NAME = os.getenv("SERVICE_NAME", "mock").strip().lower()
SERVICE_LABEL = SERVICE_NAME if SERVICE_NAME.startswith("mock-") else f"mock-{SERVICE_NAME}"
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8080"))
FAULT_MODES = {"healthy", "unhealthy", "timeout", "error"}
state_lock = threading.Lock()
initial_mode = os.getenv("FAULT_MODE", "healthy").strip().lower()
fault_state = {"mode": initial_mode if initial_mode in FAULT_MODES else "healthy"}


def current_mode() -> str:
    with state_lock:
        return str(fault_state["mode"])


def set_mode(mode: str) -> str:
    normalized = mode.strip().lower()
    if normalized not in FAULT_MODES:
        allowed = ", ".join(sorted(FAULT_MODES))
        raise ValueError(f"mode must be one of: {allowed}")
    with state_lock:
        fault_state["mode"] = normalized
    return normalized


def fault_delay() -> float:
    try:
        return max(0.0, min(float(os.getenv("FAULT_DELAY_SECONDS", "5")), 30.0))
    except ValueError:
        return 5.0


def service_metadata() -> dict[str, object]:
    return {
        "service": SERVICE_LABEL,
        "environment": "ACME-LAB",
        "simulation": True,
        "fault_control": "/admin/faults",
    }


def mock_payload(path: str) -> dict[str, object]:
    if SERVICE_NAME == "salesforce":
        if path == "/services/oauth2/token":
            return {
                "access_token": "mock-salesforce-token",
                "token_type": "Bearer",
                "expires_in": 3600,
                "instance_url": "http://mock-salesforce:8080",
            }
        if path == "/services/data/v61.0/query":
            return {
                "totalSize": 1,
                "done": True,
                "records": [
                    {
                        "Id": "001ACME000000001",
                        "Name": "ACME Lab Customer",
                        "Customer_Key__c": "CUST-ACME-001",
                        "BillingEmail": "customer@example.invalid",
                    }
                ],
            }
        if path == "/services/data/v61.0/sobjects/Account/001ACME000000001":
            return {
                "id": "001ACME000000001",
                "Name": "ACME Lab Customer",
                "Customer_Key__c": "CUST-ACME-001",
                "BillingEmail": "customer@example.invalid",
            }
    if SERVICE_NAME == "okta":
        if path == "/oauth2/v1/token":
            return {
                "access_token": "mock-okta-token",
                "token_type": "Bearer",
                "expires_in": 3600,
            }
        if path == "/api/v1/users":
            return [
                {
                    "id": "00uACME000000001",
                    "status": "ACTIVE",
                    "profile": {
                        "login": "lab-user@example.invalid",
                        "email": "lab-user@example.invalid",
                        "firstName": "ACME",
                        "lastName": "Lab",
                    },
                }
            ]
        if path == "/api/v1/users/me":
            return {
                "id": "00uACME000000001",
                "status": "ACTIVE",
                "profile": {
                    "login": "lab-user@example.invalid",
                    "email": "lab-user@example.invalid",
                    "firstName": "ACME",
                    "lastName": "Lab",
                },
            }
    return service_metadata()


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def send_json(self, status: int, payload: object) -> None:
        body = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def read_json(self) -> dict[str, object]:
        length = int(self.headers.get("Content-Length", "0"))
        if length < 0 or length > 4096:
            raise ValueError("request body is too large")
        raw = self.rfile.read(length)
        if not raw:
            return {}
        value = json.loads(raw.decode("utf-8"))
        if not isinstance(value, dict):
            raise ValueError("request body must be a JSON object")
        return value

    def apply_fault(self, health: bool = False) -> bool:
        mode = current_mode()
        if mode == "unhealthy":
            self.send_json(
                503,
                {
                    "service": SERVICE_LABEL,
                    "status": "unhealthy",
                    "fault_mode": mode,
                },
            )
            return True
        if mode == "error":
            self.send_json(
                500,
                {
                    "service": SERVICE_LABEL,
                    "status": "error",
                    "fault_mode": mode,
                },
            )
            return True
        if mode == "timeout":
            time.sleep(fault_delay())
            if health:
                self.send_json(
                    200,
                    {
                        "service": SERVICE_LABEL,
                        "status": "ok",
                        "fault_mode": mode,
                    },
                )
                return True
        return False

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/healthz":
            if self.apply_fault(health=True):
                return
            self.send_json(
                200,
                {
                    "service": SERVICE_LABEL,
                    "status": "ok",
                    "fault_mode": current_mode(),
                },
            )
            return
        if path == "/admin/faults":
            self.send_json(
                200,
                {
                    "service": SERVICE_LABEL,
                    "mode": current_mode(),
                    "available_modes": sorted(FAULT_MODES),
                },
            )
            return
        if self.apply_fault():
            return
        self.send_json(200, mock_payload(path))

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path == "/admin/faults":
            try:
                payload = self.read_json()
                mode = set_mode(str(payload.get("mode", "")))
            except (UnicodeDecodeError, ValueError, json.JSONDecodeError) as error:
                self.send_json(400, {"error": str(error)})
                return
            self.send_json(200, {"service": SERVICE_LABEL, "mode": mode})
            return
        if path == "/admin/reset":
            self.send_json(200, {"service": SERVICE_LABEL, "mode": set_mode("healthy")})
            return
        if self.apply_fault():
            return
        if path in {"/services/oauth2/token", "/oauth2/v1/token"}:
            self.send_json(200, mock_payload(path))
            return
        self.send_json(404, {"error": "not found", "service": SERVICE_LABEL})

    def log_message(self, format: str, *args: object) -> None:
        return


class ReusableHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    server = ReusableHTTPServer((HOST, PORT), Handler)
    server.serve_forever()
