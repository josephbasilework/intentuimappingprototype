from __future__ import annotations

from datetime import datetime, timezone
import os
from textwrap import dedent

from ag_ui.core import EventType, StateSnapshotEvent
from pydantic_ai import Agent, RunContext
from pydantic_ai.ag_ui import StateDeps
from pydantic_ai.models.openai import OpenAIResponsesModel

from dotenv import load_dotenv

from models.meaning_index import MeaningEntry
from models.state import HistoryItem, IntentConfirmation, IntentUIState
from models.task_dag import Dependency, Source, Step, TaskNode, TaskStatus, TaskDAG

load_dotenv()


def _load_gateway_model() -> OpenAIResponsesModel:
    gateway_base_url = os.getenv("PYDANTIC_AI_GATEWAY_BASE_URL")
    if not gateway_base_url:
        raise ValueError(
            "Missing PYDANTIC_AI_GATEWAY_BASE_URL. Set the Pydantic AI Gateway base URL "
            "to route requests through the gateway."
        )

    gateway_api_key = os.getenv("PYDANTIC_AI_GATEWAY_API_KEY")
    byok_api_key = os.getenv("PYDANTIC_AI_BYOK_API_KEY") or os.getenv("OPENAI_API_KEY")

    if gateway_api_key:
        api_key = gateway_api_key
    elif byok_api_key:
        api_key = byok_api_key
    else:
        raise ValueError(
            "Missing gateway credentials. Set PYDANTIC_AI_GATEWAY_API_KEY for gateway "
            "billing or PYDANTIC_AI_BYOK_API_KEY/OPENAI_API_KEY for BYOK access."
        )

    return OpenAIResponsesModel(
        "gpt-4.1-mini",
        base_url=gateway_base_url,
        api_key=api_key,
    )

agent = Agent(
    model=_load_gateway_model(),
    deps_type=StateDeps[IntentUIState],
    system_prompt=dedent(
        """
        You are the Intent UI Mapping agent. Your job is to clarify user intent,
        update the Meaning Index, and maintain a Task DAG for planning.

        Always:
        - Keep the Meaning Index aligned with confirmed meanings.
        - Use request_clarification when the intent is ambiguous or conflicting.
        - Update Task DAG nodes with clear status transitions.
        - Emit state snapshots whenever you mutate shared state.
        """
    ).strip(),
)


def _snapshot(state: IntentUIState) -> StateSnapshotEvent:
    return StateSnapshotEvent(type=EventType.STATE_SNAPSHOT, snapshot=state)


def _normalize_key(value: str) -> str:
    return value.strip().lower()


@agent.tool
def get_state_summary(ctx: RunContext[StateDeps[IntentUIState]]) -> str:
    """Summarize current Meaning Index and Task DAG state."""
    state = ctx.deps.state
    return (
        f"Meaning Index entries: {len(state.meaning_index)}. "
        f"Task DAG entries: {len(state.task_dag)}."
    )


@agent.tool
def get_task(ctx: RunContext[StateDeps[IntentUIState]], task_id: str) -> TaskNode | None:
    """Retrieve a task by ID."""
    return ctx.deps.state.task_dag.get(task_id)


@agent.tool
def get_all_tasks(ctx: RunContext[StateDeps[IntentUIState]]) -> dict[str, TaskNode]:
    """List all task DAG nodes."""
    return ctx.deps.state.task_dag


@agent.tool
async def create_task(
    ctx: RunContext[StateDeps[IntentUIState]],
    task_id: str,
    title: str,
    description: str,
    status: TaskStatus = "pending",
    dependencies: list[Dependency] | None = None,
    sources: list[Source] | None = None,
    steps: list[Step] | None = None,
) -> StateSnapshotEvent:
    """Create a Task DAG node."""
    if task_id in ctx.deps.state.task_dag:
        raise ValueError(f"Task '{task_id}' already exists.")
    task = TaskNode(
        id=task_id,
        title=title,
        description=description,
        status=status,
        dependencies=dependencies or [],
        sources=sources or [],
        steps=steps or [],
    )
    ctx.deps.state.task_dag[task_id] = task
    TaskDAG(tasks=ctx.deps.state.task_dag).validate_acyclic()
    return _snapshot(ctx.deps.state)


@agent.tool
async def update_task_status(
    ctx: RunContext[StateDeps[IntentUIState]],
    task_id: str,
    status: TaskStatus,
) -> StateSnapshotEvent:
    """Update Task DAG node status with dependency validation."""
    task = ctx.deps.state.task_dag.get(task_id)
    if not task:
        raise ValueError(f"Task '{task_id}' not found.")
    dag = TaskDAG(tasks=ctx.deps.state.task_dag)
    if status in ("in_progress", "completed") and not dag.can_execute(task_id):
        raise ValueError("Task dependencies are not satisfied.")
    task.status = status
    ctx.deps.state.task_dag[task_id] = task
    return _snapshot(ctx.deps.state)


@agent.tool
async def update_task(
    ctx: RunContext[StateDeps[IntentUIState]],
    task_id: str,
    title: str | None = None,
    description: str | None = None,
    status: TaskStatus | None = None,
    dependencies: list[Dependency] | None = None,
    sources: list[Source] | None = None,
    steps: list[Step] | None = None,
) -> StateSnapshotEvent:
    """Update a Task DAG node."""
    task = ctx.deps.state.task_dag.get(task_id)
    if not task:
        raise ValueError(f"Task '{task_id}' not found.")
    task.title = title or task.title
    task.description = description or task.description
    if status:
        task.status = status
    if dependencies is not None:
        task.dependencies = dependencies
    if sources is not None:
        task.sources = sources
    if steps is not None:
        task.steps = steps
    ctx.deps.state.task_dag[task_id] = task
    TaskDAG(tasks=ctx.deps.state.task_dag).validate_acyclic()
    return _snapshot(ctx.deps.state)


@agent.tool
async def delete_task(
    ctx: RunContext[StateDeps[IntentUIState]],
    task_id: str,
    cascade: bool = False,
) -> StateSnapshotEvent:
    """Delete a task node, optionally cascading dependencies."""
    if task_id not in ctx.deps.state.task_dag:
        raise ValueError(f"Task '{task_id}' not found.")
    ctx.deps.state.task_dag.pop(task_id)
    if cascade:
        for task in ctx.deps.state.task_dag.values():
            task.dependencies = [
                dep for dep in task.dependencies if dep.from_task != task_id
            ]
    return _snapshot(ctx.deps.state)


@agent.tool
def get_meaning(
    ctx: RunContext[StateDeps[IntentUIState]],
    word_or_phrase: str,
) -> MeaningEntry | None:
    """Fetch a meaning entry by key."""
    key = _normalize_key(word_or_phrase)
    return ctx.deps.state.meaning_index.get(key)


@agent.tool
def search_meanings(
    ctx: RunContext[StateDeps[IntentUIState]],
    query: str,
) -> list[MeaningEntry]:
    """Search meaning entries by key or content."""
    needle = _normalize_key(query)
    return [
        entry
        for key, entry in ctx.deps.state.meaning_index.items()
        if needle in key or needle in entry.meaning.lower()
    ]


@agent.tool
async def add_meaning(
    ctx: RunContext[StateDeps[IntentUIState]],
    word_or_phrase: str,
    meaning: str,
    sources: list[str] | None = None,
    context: str | None = None,
) -> StateSnapshotEvent:
    """Create a Meaning Index entry."""
    key = _normalize_key(word_or_phrase)
    entry = MeaningEntry(
        word_or_phrase=word_or_phrase,
        meaning=meaning,
        sources=sources or [],
        context=context,
    )
    ctx.deps.state.meaning_index[key] = entry
    return _snapshot(ctx.deps.state)


@agent.tool
async def update_meaning(
    ctx: RunContext[StateDeps[IntentUIState]],
    word_or_phrase: str,
    meaning: str | None = None,
    sources: list[str] | None = None,
    context: str | None = None,
) -> StateSnapshotEvent:
    """Update an existing Meaning Index entry."""
    key = _normalize_key(word_or_phrase)
    entry = ctx.deps.state.meaning_index.get(key)
    if not entry:
        raise ValueError(f"Meaning entry '{word_or_phrase}' not found.")
    if meaning is not None:
        entry.meaning = meaning
    if sources is not None:
        entry.sources = sources
    if context is not None:
        entry.context = context
    entry.touch()
    ctx.deps.state.meaning_index[key] = entry
    return _snapshot(ctx.deps.state)


@agent.tool
async def delete_meaning(
    ctx: RunContext[StateDeps[IntentUIState]],
    word_or_phrase: str,
) -> StateSnapshotEvent:
    """Delete a Meaning Index entry."""
    key = _normalize_key(word_or_phrase)
    if key not in ctx.deps.state.meaning_index:
        raise ValueError(f"Meaning entry '{word_or_phrase}' not found.")
    ctx.deps.state.meaning_index.pop(key)
    return _snapshot(ctx.deps.state)


@agent.tool
async def request_clarification(
    ctx: RunContext[StateDeps[IntentUIState]],
    question: str,
    options: list[str] | None = None,
    context: str | None = None,
) -> StateSnapshotEvent:
    """Trigger the intent confirmation area for clarification."""
    ctx.deps.state.intent_confirmation = IntentConfirmation(
        status="needs_clarification",
        prompt=question,
        options=options or [],
        context=context,
    )
    return _snapshot(ctx.deps.state)


@agent.tool
async def append_history_item(
    ctx: RunContext[StateDeps[IntentUIState]],
    role: str,
    content: str,
    tool_name: str | None = None,
) -> StateSnapshotEvent:
    """Add an item to the shared history log."""
    ctx.deps.state.history.append(
        HistoryItem(
            id=f"history-{len(ctx.deps.state.history) + 1}",
            role=role,
            content=content,
            timestamp=datetime.now(timezone.utc).isoformat(),
            tool_name=tool_name,
        )
    )
    return _snapshot(ctx.deps.state)
