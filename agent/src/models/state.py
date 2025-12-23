from typing import Literal, Optional

from pydantic import BaseModel, Field

from .meaning_index import MeaningEntry
from .task_dag import TaskNode


class IntentConfirmation(BaseModel):
    status: Literal["idle", "needs_clarification", "confirmed"] = "idle"
    prompt: str = ""
    options: list[str] = Field(default_factory=list)
    context: Optional[str] = None
    response: Optional[str] = None


class HistoryItem(BaseModel):
    id: str
    role: Literal["user", "assistant", "tool"]
    content: str
    timestamp: str
    tool_name: Optional[str] = None


class IntentUIState(BaseModel):
    meaning_index: dict[str, MeaningEntry] = Field(default_factory=dict)
    task_dag: dict[str, TaskNode] = Field(default_factory=dict)
    intent_confirmation: IntentConfirmation = Field(default_factory=IntentConfirmation)
    history: list[HistoryItem] = Field(default_factory=list)
