from typing import Any


class ControlPlaneError(Exception):
    code = "control_plane_error"
    status_code = 500

    def __init__(self, message: str, context: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.context = context or {}


class ResourceNotFoundError(ControlPlaneError):
    code = "resource_not_found"
    status_code = 404

    def __init__(self, resource_id: str) -> None:
        super().__init__(
            f"Resource '{resource_id}' was not found in the simulation repository.",
            {"resource_id": resource_id},
        )


class MappingNotFoundError(ControlPlaneError):
    code = "mapping_not_found"
    status_code = 404

    def __init__(self, suggestion_id: str) -> None:
        super().__init__(
            f"Mapping suggestion '{suggestion_id}' was not found in the simulation repository.",
            {"suggestion_id": suggestion_id},
        )


class InvalidMappingTransitionError(ControlPlaneError):
    code = "invalid_mapping_transition"
    status_code = 409

    def __init__(
        self,
        suggestion_id: str,
        current_status: str,
        action: str,
    ) -> None:
        super().__init__(
            f"Action '{action}' is not allowed while mapping '{suggestion_id}' is '{current_status}'.",
            {
                "suggestion_id": suggestion_id,
                "current_status": current_status,
                "action": action,
            },
        )


class StaleMappingRevisionError(ControlPlaneError):
    code = "stale_mapping_revision"
    status_code = 409

    def __init__(self, suggestion_id: str, expected_revision: int, actual_revision: int) -> None:
        super().__init__(
            f"Mapping '{suggestion_id}' changed after revision {expected_revision} was read.",
            {
                "suggestion_id": suggestion_id,
                "expected_revision": expected_revision,
                "actual_revision": actual_revision,
            },
        )


class IncidentNotFoundError(ControlPlaneError):
    code = "incident_not_found"
    status_code = 404

    def __init__(self, incident_id: str) -> None:
        super().__init__(
            f"Incident '{incident_id}' was not found in the simulation repository.",
            {"incident_id": incident_id},
        )
