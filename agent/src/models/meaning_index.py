from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field


class MeaningEntry(BaseModel):
    word_or_phrase: str
    meaning: str
    sources: list[str] = Field(default_factory=list)
    context: Optional[str] = None
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    updated_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    def touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc).isoformat()
