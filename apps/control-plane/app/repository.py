from __future__ import annotations

from datetime import UTC, datetime
from threading import RLock
from typing import Final, TypeVar

from app.config import settings
from app.errors import (
    IncidentNotFoundError,
    MappingNotFoundError,
    StaleMappingRevisionError,
)
from app.graph import ResourceGraph
from app.models import (
    CompatibilityStatus,
    EvidenceSignal,
    Environment,
    IncidentEvidence,
    IncidentRecord,
    IncidentSeverity,
    IncidentState,
    Integration,
    MappingStatus,
    MappingSuggestion,
    Resource,
    ResourceStatus,
    SimulationMetadata,
)


def _timestamp(hour: int, minute: int) -> datetime:
    return datetime(2026, 3, 14, hour, minute, tzinfo=UTC)


SIMULATION_RESOURCES: Final[tuple[Resource, ...]] = (
    Resource(
        id="acme-estate",
        name="ACME simulation estate",
        provider="Simulation",
        kind="Environment",
        environment=Environment.PRODUCTION,
        status=ResourceStatus.WARNING,
        owner="Platform operations",
        region="Multi-region",
        description="Simulation boundary representing the ACME production estate.",
        depends_on=("aws-production", "azure-production", "workforce-identity"),
        permissions=("environment:read",),
        tags=("acme", "production", "simulation"),
    ),
    Resource(
        id="aws-production",
        name="Simulated AWS account",
        provider="AWS",
        kind="Cloud account",
        environment=Environment.PRODUCTION,
        status=ResourceStatus.HEALTHY,
        owner="Cloud platform",
        region="us-east-1",
        description="Simulation inventory for an AWS production account.",
        permissions=("inventory:read", "network:read"),
        tags=("aws", "production", "simulation"),
    ),
    Resource(
        id="azure-production",
        name="Simulated Azure subscription",
        provider="Azure",
        kind="Cloud subscription",
        environment=Environment.PRODUCTION,
        status=ResourceStatus.HEALTHY,
        owner="Cloud platform",
        region="eastus",
        description="Simulation inventory for an Azure production subscription.",
        permissions=("inventory:read", "network:read"),
        tags=("azure", "production", "simulation"),
    ),
    Resource(
        id="workforce-identity",
        name="Simulated workforce identity",
        provider="Okta",
        kind="Identity provider",
        environment=Environment.PRODUCTION,
        status=ResourceStatus.HEALTHY,
        owner="Security engineering",
        region="Global",
        description="Simulation inventory for an OIDC identity provider.",
        permissions=("client:read", "jwks:read"),
        tags=("identity", "oidc", "simulation"),
    ),
    Resource(
        id="workload-cluster",
        name="Simulated customer workload cluster",
        provider="AWS",
        kind="Kubernetes cluster",
        environment=Environment.PRODUCTION,
        status=ResourceStatus.HEALTHY,
        owner="Platform operations",
        region="us-east-1",
        description="Simulation inventory for the customer-facing workload cluster.",
        depends_on=("aws-production",),
        permissions=("workload:read", "metrics:read"),
        tags=("kubernetes", "compute", "simulation"),
    ),
    Resource(
        id="integration-cluster",
        name="Simulated integration cluster",
        provider="Azure",
        kind="Kubernetes cluster",
        environment=Environment.PRODUCTION,
        status=ResourceStatus.HEALTHY,
        owner="Integration platform",
        region="eastus",
        description="Simulation inventory for the integration workload cluster.",
        depends_on=("azure-production",),
        permissions=("workload:read", "metrics:read"),
        tags=("kubernetes", "integration", "simulation"),
    ),
    Resource(
        id="customer-database",
        name="Simulated customer database",
        provider="AWS",
        kind="PostgreSQL",
        environment=Environment.PRODUCTION,
        status=ResourceStatus.HEALTHY,
        owner="Customer domain",
        region="us-east-1",
        description="Simulation inventory for the customer persistence layer.",
        depends_on=("aws-production",),
        permissions=("customer:read", "customer:write"),
        tags=("database", "customer", "simulation"),
    ),
    Resource(
        id="customer-api",
        name="Simulated customer API",
        provider="AWS",
        kind="REST API",
        environment=Environment.PRODUCTION,
        status=ResourceStatus.HEALTHY,
        owner="Customer domain",
        region="us-east-1",
        description="Simulation inventory for a customer lookup API.",
        depends_on=("workload-cluster", "workforce-identity", "customer-database"),
        permissions=("customer:read", "customer:write"),
        tags=("api", "customer", "tier-one", "simulation"),
    ),
    Resource(
        id="enterprise-event-stream",
        name="Simulated enterprise event stream",
        provider="AWS",
        kind="Event broker",
        environment=Environment.PRODUCTION,
        status=ResourceStatus.HEALTHY,
        owner="Platform operations",
        region="us-east-1",
        description="Simulation inventory for the enterprise event bus.",
        depends_on=("workload-cluster",),
        permissions=("topic:read", "topic:write"),
        tags=("events", "messaging", "simulation"),
    ),
    Resource(
        id="order-orchestrator",
        name="Simulated order orchestrator",
        provider="AWS",
        kind="Worker service",
        environment=Environment.PRODUCTION,
        status=ResourceStatus.HEALTHY,
        owner="Order domain",
        region="us-east-1",
        description="Simulation inventory for order orchestration.",
        depends_on=(
            "workload-cluster",
            "customer-api",
            "enterprise-event-stream",
            "analytics-warehouse",
        ),
        permissions=("orders:write",),
        tags=("orders", "tier-one", "simulation"),
    ),
    Resource(
        id="salesforce-crm",
        name="Simulated Salesforce organization",
        provider="Salesforce",
        kind="SaaS",
        environment=Environment.PRODUCTION,
        status=ResourceStatus.WARNING,
        owner="Revenue systems",
        region="External",
        description="Simulation inventory for a CRM integration destination.",
        permissions=("api:read", "api:write"),
        tags=("saas", "crm", "external", "simulation"),
    ),
    Resource(
        id="salesforce-sync-worker",
        name="Simulated Salesforce sync worker",
        provider="Azure",
        kind="Worker service",
        environment=Environment.PRODUCTION,
        status=ResourceStatus.WARNING,
        owner="Revenue systems",
        region="eastus",
        description="Simulation inventory for the CRM synchronization worker.",
        depends_on=("integration-cluster", "salesforce-crm"),
        permissions=("queue:consume", "salesforce:write"),
        tags=("salesforce", "worker", "simulation"),
    ),
    Resource(
        id="analytics-warehouse",
        name="Simulated analytics warehouse",
        provider="Snowflake",
        kind="Data warehouse",
        environment=Environment.PRODUCTION,
        status=ResourceStatus.CRITICAL,
        owner="Data platform",
        region="External",
        description="Simulation inventory for an external analytics warehouse.",
        permissions=("warehouse:read",),
        tags=("warehouse", "external", "blocked", "simulation"),
    ),
    Resource(
        id="support-console",
        name="Simulated support console",
        provider="Internal",
        kind="Web application",
        environment=Environment.PRODUCTION,
        status=ResourceStatus.WARNING,
        owner="Customer operations",
        region="Internal",
        description="Simulation inventory for an internal support application.",
        depends_on=("order-orchestrator", "salesforce-crm"),
        permissions=("support:read"),
        tags=("support", "internal", "simulation"),
    ),
)


SIMULATION_MAPPINGS: Final[tuple[MappingSuggestion, ...]] = (
    MappingSuggestion(
        id="map-customer-id",
        source_system="legacy_mysql",
        source_table="customer_master",
        source_field="CID",
        source_type="bigint",
        target_field="customer.id",
        target_type="uuid",
        confidence=98.4,
        status=MappingStatus.PENDING,
        evidence=(
            "Simulated integer compatibility",
            "Simulated uniqueness profile",
            "Simulated relationship similarity",
        ),
    ),
    MappingSuggestion(
        id="map-customer-email",
        source_system="legacy_mysql",
        source_table="customer_master",
        source_field="email_address",
        source_type="varchar(320)",
        target_field="customer.email",
        target_type="text",
        confidence=96.8,
        status=MappingStatus.PENDING,
        evidence=(
            "Simulated domain overlap",
            "Simulated format distribution",
            "Simulated null profile",
        ),
    ),
    MappingSuggestion(
        id="map-customer-name",
        source_system="legacy_mysql",
        source_table="customer_master",
        source_field="full_name",
        source_type="varchar(180)",
        target_field="customer.name",
        target_type="jsonb",
        confidence=88.1,
        status=MappingStatus.PENDING,
        evidence=(
            "Simulated token shape",
            "Simulated sample overlap",
            "Simulated field-name affinity",
        ),
    ),
    MappingSuggestion(
        id="map-customer-status",
        source_system="legacy_mysql",
        source_table="customer_master",
        source_field="state_code",
        source_type="char(2)",
        target_field="customer.status",
        target_type="enum",
        confidence=74.2,
        status=MappingStatus.PENDING,
        evidence=(
            "Simulated value overlap",
            "Simulated relationship cardinality",
            "Simulated business-rule ambiguity",
        ),
    ),
    MappingSuggestion(
        id="map-customer-phone",
        source_system="legacy_mysql",
        source_table="customer_master",
        source_field="phone",
        source_type="varchar(40)",
        target_field="customer.phone",
        target_type="text",
        confidence=91.6,
        status=MappingStatus.PENDING,
        evidence=(
            "Simulated format distribution",
            "Simulated country-code overlap",
            "Simulated uniqueness profile",
        ),
    ),
)


RecordT = TypeVar("RecordT")


SIMULATION_INCIDENTS: Final[tuple[IncidentRecord, ...]] = (
    IncidentRecord(
        id="dx-1842-simulation",
        title="Salesforce customer sync degradation",
        severity=IncidentSeverity.HIGH,
        state=IncidentState.INVESTIGATING,
        customer="acme",
        started_at=_timestamp(14, 32),
        detected_at=_timestamp(14, 33),
        probable_cause=(
            "The deterministic incident model associates the degradation with "
            "a simulated Salesforce API quota limit."
        ),
        confidence=93,
        affected_resource_ids=(
            "salesforce-sync-worker",
            "salesforce-crm",
            "support-console",
        ),
        affected_workflow_ids=(
            "salesforce-customer-sync",
            "customer-context-enrichment",
        ),
        related_release_ids=("dx-842-simulation",),
        evidence=(
            IncidentEvidence(
                id="sf-rate-limit",
                label="Simulated Salesforce quota responses",
                observed_value="812 simulated responses above baseline",
                signal=EvidenceSignal.DEGRADATION,
                observed_at=_timestamp(14, 33),
                related_resource_ids=("salesforce-crm", "salesforce-sync-worker"),
                related_workflow_ids=("salesforce-customer-sync",),
            ),
            IncidentEvidence(
                id="sf-volume",
                label="Simulated connector request volume",
                observed_value="317 percent above baseline",
                signal=EvidenceSignal.CHANGE,
                observed_at=_timestamp(14, 31),
                related_resource_ids=("salesforce-sync-worker",),
                related_workflow_ids=("salesforce-customer-sync",),
            ),
            IncidentEvidence(
                id="related-release",
                label="Simulated preceding release",
                observed_value="Released eleven minutes before onset",
                signal=EvidenceSignal.CORRELATION,
                observed_at=_timestamp(14, 21),
                related_release_ids=("dx-842-simulation",),
                related_resource_ids=("salesforce-sync-worker",),
            ),
            IncidentEvidence(
                id="observed-scope",
                label="Simulated observed scope",
                observed_value="Three resources and two workflows",
                signal=EvidenceSignal.SCOPE,
                observed_at=_timestamp(14, 34),
                related_resource_ids=(
                    "salesforce-sync-worker",
                    "salesforce-crm",
                    "support-console",
                ),
                related_workflow_ids=(
                    "salesforce-customer-sync",
                    "customer-context-enrichment",
                ),
            ),
        ),
        remediation=(
            "Simulation recommendation: enable a bounded customer projection cache.",
            "Simulation recommendation: reduce simulated connector concurrency.",
            "Simulation recommendation: retain failed events for bounded retry.",
            "Simulation recommendation: keep automated production approval disabled.",
        ),
    ),
)


class SimulationRepository:
    def __init__(
        self,
        resources: tuple[Resource, ...] = SIMULATION_RESOURCES,
        mappings: tuple[MappingSuggestion, ...] = SIMULATION_MAPPINGS,
        incidents: tuple[IncidentRecord, ...] = SIMULATION_INCIDENTS,
    ) -> None:
        self._graph = ResourceGraph(resources)
        self._mapping_by_id = self._index_unique(mappings, "mapping suggestion")
        self._incident_by_id = self._index_unique(incidents, "incident")
        self._target_permissions = frozenset(
            {
                "customer:read",
                "customer:write",
                "environment:read",
                "inventory:read",
                "metrics:read",
                "network:read",
                "orders:write",
                "queue:consume",
                "salesforce:write",
                "support:read",
                "topic:read",
                "topic:write",
                "warehouse:read",
                "workload:read",
            }
        )
        self._integration_network_status = {
            Integration.CUSTOMER_API: CompatibilityStatus.PASS,
            Integration.SALESFORCE: CompatibilityStatus.WARNING,
            Integration.SNOWFLAKE: CompatibilityStatus.BLOCKED,
            Integration.KAFKA: CompatibilityStatus.PASS,
            Integration.OKTA: CompatibilityStatus.PASS,
        }
        self._lock = RLock()

    @property
    def graph(self) -> ResourceGraph:
        return self._graph

    def metadata(self) -> SimulationMetadata:
        return SimulationMetadata(
            customer=settings.customer_name.lower(),
            notice=settings.simulation_notice,
        )

    def list_resources(self) -> tuple[Resource, ...]:
        return self._graph.resources

    def get_resource(self, resource_id: str) -> Resource:
        return self._graph.get_resource(resource_id)

    def list_mappings(
        self,
        status: MappingStatus | None = None,
    ) -> tuple[MappingSuggestion, ...]:
        with self._lock:
            mappings = tuple(self._mapping_by_id.values())
        if status is not None:
            mappings = tuple(mapping for mapping in mappings if mapping.status is status)
        return tuple(sorted(mappings, key=lambda mapping: mapping.id))

    def get_mapping(self, suggestion_id: str) -> MappingSuggestion:
        with self._lock:
            try:
                return self._mapping_by_id[suggestion_id]
            except KeyError as error:
                raise MappingNotFoundError(suggestion_id) from error

    def save_mapping_if_revision(
        self,
        suggestion: MappingSuggestion,
        expected_revision: int,
    ) -> MappingSuggestion:
        with self._lock:
            current = self._mapping_by_id.get(suggestion.id)
            if current is None:
                raise MappingNotFoundError(suggestion.id)
            if current.revision != expected_revision:
                raise StaleMappingRevisionError(
                    suggestion.id,
                    expected_revision,
                    current.revision,
                )
            self._mapping_by_id[suggestion.id] = suggestion
            return suggestion

    def has_permission(self, permission: str) -> bool:
        return permission in self._target_permissions

    def integration_network_status(self, integration: Integration) -> CompatibilityStatus:
        return self._integration_network_status[integration]

    def list_incidents(self) -> tuple[IncidentRecord, ...]:
        return tuple(sorted(self._incident_by_id.values(), key=lambda incident: incident.id))

    def get_incident(self, incident_id: str) -> IncidentRecord:
        try:
            return self._incident_by_id[incident_id]
        except KeyError as error:
            raise IncidentNotFoundError(incident_id) from error

    @staticmethod
    def _index_unique(records: tuple[RecordT, ...], label: str) -> dict[str, RecordT]:
        indexed: dict[str, RecordT] = {}
        for record in records:
            record_id = str(getattr(record, "id"))
            if record_id in indexed:
                raise ValueError(f"Duplicate {label} id '{record_id}'.")
            indexed[record_id] = record
        return indexed
