from __future__ import annotations

from collections import deque
from collections.abc import Iterable

from app.errors import ResourceNotFoundError
from app.models import (
    BlastRadiusAssessment,
    GraphTraversal,
    Resource,
    TraversalDirection,
)


class ResourceGraph:
    def __init__(self, resources: Iterable[Resource]) -> None:
        ordered_resources = tuple(sorted(resources, key=lambda resource: resource.id))
        resource_by_id: dict[str, Resource] = {}

        for resource in ordered_resources:
            if resource.id in resource_by_id:
                raise ValueError(f"Duplicate resource id '{resource.id}'.")
            resource_by_id[resource.id] = resource

        dependencies: dict[str, tuple[str, ...]] = {}
        dependents: dict[str, tuple[str, ...]] = {
            resource_id: () for resource_id in resource_by_id
        }

        for resource in ordered_resources:
            if len(set(resource.depends_on)) != len(resource.depends_on):
                raise ValueError(f"Resource '{resource.id}' contains duplicate dependencies.")
            for dependency_id in resource.depends_on:
                if dependency_id == resource.id:
                    raise ValueError(f"Resource '{resource.id}' cannot depend on itself.")
                if dependency_id not in resource_by_id:
                    raise ValueError(
                        f"Resource '{resource.id}' references unknown dependency '{dependency_id}'."
                    )
            dependencies[resource.id] = tuple(sorted(resource.depends_on))

        for resource in ordered_resources:
            for dependency_id in resource.depends_on:
                current_dependents = dependents[dependency_id]
                dependents[dependency_id] = tuple(
                    sorted({*current_dependents, resource.id})
                )

        self._resources = ordered_resources
        self._resource_by_id = resource_by_id
        self._dependencies = dependencies
        self._dependents = dependents
        self._cycles = tuple(sorted(self._find_cycles()))

    @property
    def resources(self) -> tuple[Resource, ...]:
        return self._resources

    def get_resource(self, resource_id: str) -> Resource:
        try:
            return self._resource_by_id[resource_id]
        except KeyError as error:
            raise ResourceNotFoundError(resource_id) from error

    def dependencies(self, resource_id: str) -> tuple[str, ...]:
        self.get_resource(resource_id)
        return self._dependencies[resource_id]

    def dependents(self, resource_id: str) -> tuple[str, ...]:
        self.get_resource(resource_id)
        return self._dependents[resource_id]

    def traverse(
        self,
        resource_id: str,
        direction: TraversalDirection = TraversalDirection.DEPENDENCIES,
    ) -> GraphTraversal:
        self.get_resource(resource_id)
        queue: deque[str] = deque([resource_id])
        visited = {resource_id}
        layers: list[tuple[str, ...]] = []

        while queue:
            layer: list[str] = []
            for _ in range(len(queue)):
                current = queue.popleft()
                for neighbor in self._neighbors(current, direction):
                    if neighbor in visited:
                        continue
                    visited.add(neighbor)
                    queue.append(neighbor)
                    layer.append(neighbor)
            if layer:
                layers.append(tuple(layer))

        traversed_ids = tuple(
            resource_id for layer in layers for resource_id in layer
        )
        return GraphTraversal(
            root_resource_id=resource_id,
            direction=direction,
            resources=tuple(self._resource_by_id[item] for item in traversed_ids),
            layers=tuple(layers),
            cycles_detected=self._cycles,
        )

    def blast_radius(self, root_resource_ids: Iterable[str]) -> BlastRadiusAssessment:
        roots = tuple(sorted(set(root_resource_ids)))
        if not roots:
            raise ValueError("At least one root resource is required for blast-radius analysis.")
        for resource_id in roots:
            self.get_resource(resource_id)

        root_set = set(roots)
        queue: deque[str] = deque(roots)
        visited = set(roots)
        layers: list[tuple[str, ...]] = []
        layer_by_id: dict[str, int] = {}

        while queue:
            current = queue.popleft()
            for dependent_id in self._dependents[current]:
                if dependent_id in visited:
                    continue
                visited.add(dependent_id)
                queue.append(dependent_id)
                if dependent_id in root_set:
                    continue
                layer_index = 0 if current in root_set else layer_by_id[current] + 1
                while len(layers) <= layer_index:
                    layers.append(())
                layers[layer_index] = tuple(sorted({*layers[layer_index], dependent_id}))
                layer_by_id[dependent_id] = layer_index

        all_affected_ids = tuple(
            resource_id
            for layer in layers
            for resource_id in layer
        )
        directly_affected_ids = tuple(layers[0]) if layers else ()
        direct_set = set(directly_affected_ids)
        transitively_affected_ids = tuple(
            resource_id
            for resource_id in all_affected_ids
            if resource_id not in direct_set
        )
        critical_affected_ids = tuple(
            resource_id
            for resource_id in all_affected_ids
            if self._resource_by_id[resource_id].status.value == "critical"
        )

        return BlastRadiusAssessment(
            root_resource_ids=roots,
            directly_affected_resource_ids=directly_affected_ids,
            transitively_affected_resource_ids=transitively_affected_ids,
            all_affected_resource_ids=all_affected_ids,
            affected_resources=tuple(
                self._resource_by_id[resource_id]
                for resource_id in all_affected_ids
            ),
            layers=tuple(layers),
            critical_affected_resource_ids=critical_affected_ids,
            cycles_detected=self._cycles,
        )

    def _neighbors(
        self,
        resource_id: str,
        direction: TraversalDirection,
    ) -> tuple[str, ...]:
        if direction is TraversalDirection.DEPENDENCIES:
            return self._dependencies[resource_id]
        if direction is TraversalDirection.DEPENDENTS:
            return self._dependents[resource_id]
        return tuple(
            sorted({*self._dependencies[resource_id], *self._dependents[resource_id]})
        )

    def _find_cycles(self) -> set[tuple[str, ...]]:
        visited: set[str] = set()
        active: set[str] = set()
        stack: list[str] = []
        cycles: set[tuple[str, ...]] = set()

        def visit(resource_id: str) -> None:
            if resource_id in active:
                cycle_start = stack.index(resource_id)
                cycle = stack[cycle_start:]
                rotations = [
                    tuple(cycle[index:] + cycle[:index])
                    for index in range(len(cycle))
                ]
                cycles.add(min(rotations))
                return
            if resource_id in visited:
                return

            visited.add(resource_id)
            active.add(resource_id)
            stack.append(resource_id)
            for neighbor in self._neighbors(
                resource_id,
                TraversalDirection.DEPENDENCIES,
            ):
                visit(neighbor)
            stack.pop()
            active.remove(resource_id)

        for resource_id in sorted(self._resource_by_id):
            visit(resource_id)
        return cycles
