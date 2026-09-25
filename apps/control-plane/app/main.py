from __future__ import annotations

from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import router
from app.config import settings
from app.errors import ControlPlaneError
from app.models import ApiError, ApiErrorResponse
from app.openapi import install_simulation_openapi
from app.repository import SimulationRepository


def create_app(repository: SimulationRepository | None = None) -> FastAPI:
    application = FastAPI(
        title=settings.app_name,
        version=settings.version,
        description=settings.simulation_notice,
        openapi_tags=[
            {
                "name": "simulation",
                "description": (
                    "Deterministic ACME simulation endpoints. These endpoints do not access "
                    "customer infrastructure or execute deployments."
                ),
            }
        ],
    )
    application.state.repository = repository or SimulationRepository()

    application.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
        expose_headers=[
            "X-DeployX-Data-Mode",
            "X-DeployX-Simulation-Notice",
        ],
    )

    @application.middleware("http")
    async def add_simulation_metadata(
        _request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        response = await call_next(_request)
        response.headers["X-DeployX-Data-Mode"] = "simulation"
        response.headers["X-DeployX-Simulation-Notice"] = settings.simulation_notice
        return response

    @application.exception_handler(ControlPlaneError)
    async def handle_control_plane_error(
        _request: Request,
        error: ControlPlaneError,
    ) -> JSONResponse:
        response = ApiErrorResponse(
            error=ApiError(
                code=error.code,
                message=error.message,
                context=error.context,
            )
        )
        return JSONResponse(
            status_code=error.status_code,
            content=response.model_dump(mode="json"),
        )

    application.include_router(router, prefix=settings.api_prefix)
    install_simulation_openapi(application)
    return application


app = create_app()
