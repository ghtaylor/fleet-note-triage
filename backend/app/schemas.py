from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.domain.note import (
    NoteCategory,
    NotePriority,
    NoteStatus,
    SourceText,
)


class HealthResponse(BaseModel):
    status: Literal["ok"]


class NoteResponse(BaseModel):
    id: UUID
    source_text: str
    title: str
    category: NoteCategory
    priority: NotePriority
    status: NoteStatus
    created_at: datetime
    resolved_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class NoteListResponse(BaseModel):
    items: list[NoteResponse]
    total: int


class SubmitNoteRequest(BaseModel):
    source_text: SourceText


class SetNoteStatusRequest(BaseModel):
    status: NoteStatus
