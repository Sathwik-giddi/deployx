from __future__ import annotations

from typing import Any

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

from app.config import settings


def install_simulation_openapi(app: FastAPI) -> None:
    def simulation_openapi() -> dict[str, Any]:
        if app.openapi_schema is not None:
            return app.openapi_schema

        schema = get_openapi(
            title=settings.app_name,
            version=settings.version,
            description=settings.simulation_notice,
            routes=app.routes,
        )
        information = schema.setdefault("info", {})
        information["x-deployx-data-mode"] = "simulation"
        information["x-deployx-simulation-customer"] = settings.customer_name
        information["x-deployx-simulation-repository"] = "deterministic-in-memory-acme"
        information["x-deployx-customer-infrastructure-access"] = False
        information["x-deployx-deployment-execution"] = False
        app.openapi_schema = schema
        return schema

    setattr(app, "openapi", simulation_openapi)
