import os
from dataclasses import dataclass


def _cors_origins() -> tuple[str, ...]:
    configured = os.getenv("DEPLOYX_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    return tuple(origin.strip() for origin in configured.split(",") if origin.strip())


@dataclass(frozen=True, slots=True)
class Settings:
    app_name: str = "DEPLOYX Control Plane Simulation"
    version: str = "0.1.0"
    api_prefix: str = "/api/v1"
    customer_name: str = "ACME"
    simulation_notice: str = (
        "All records are deterministic in-memory ACME simulation data. "
        "This service does not connect to customer infrastructure and cannot execute deployments."
    )
    cors_origins: tuple[str, ...] = _cors_origins()


settings = Settings()
