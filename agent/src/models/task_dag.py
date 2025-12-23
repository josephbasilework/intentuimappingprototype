from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

TaskStatus = Literal["pending", "in_progress", "completed", "blocked", "skipped"]
StepStatus = Literal["pending", "in_progress", "completed", "skipped"]
DependencyType = Literal["required", "optional", "soft"]
SourceType = Literal["documentation", "file", "url", "meaning_index", "external"]


class Step(BaseModel):
    id: str
    description: str
    status: StepStatus = "pending"
    output: Optional[str] = None


class Dependency(BaseModel):
    from_task: str = Field(..., alias="from")
    to: str
    type: DependencyType = "required"

    model_config = ConfigDict(populate_by_name=True)


class Source(BaseModel):
    id: str
    type: SourceType
    reference: str
    description: Optional[str] = None


class TaskNode(BaseModel):
    id: str
    title: str
    description: str
    status: TaskStatus = "pending"
    steps: list[Step] = Field(default_factory=list)
    sources: list[Source] = Field(default_factory=list)
    dependencies: list[Dependency] = Field(default_factory=list)


class TaskDAG(BaseModel):
    tasks: dict[str, TaskNode] = Field(default_factory=dict)

    def validate_acyclic(self) -> None:
        graph: dict[str, set[str]] = {task_id: set() for task_id in self.tasks}
        for task in self.tasks.values():
            for dependency in task.dependencies:
                graph.setdefault(dependency.from_task, set()).add(dependency.to)

        visited: set[str] = set()
        visiting: set[str] = set()

        def visit(node_id: str) -> None:
            if node_id in visiting:
                raise ValueError("Cyclic dependency detected in Task DAG.")
            if node_id in visited:
                return
            visiting.add(node_id)
            for neighbor in graph.get(node_id, set()):
                visit(neighbor)
            visiting.remove(node_id)
            visited.add(node_id)

        for node_id in graph:
            visit(node_id)

    def can_execute(self, task_id: str) -> bool:
        task = self.tasks.get(task_id)
        if not task:
            return False
        for dependency in task.dependencies:
            if dependency.type == "soft":
                continue
            upstream = self.tasks.get(dependency.from_task)
            if not upstream or upstream.status != "completed":
                return False
        return True
