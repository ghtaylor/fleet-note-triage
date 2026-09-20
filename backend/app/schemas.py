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


class ErrorResponse(BaseModel):
    detail: Literal[
        "extraction_unavailable",
        "internal_server_error",
        "note_not_found",
        "source_text_not_actionable",
    ]


class ValidationErrorDetail(BaseModel):
    loc: list[str | int]
    msg: str
    type: str
    input: object | None = None
    ctx: dict[str, object] | None = None


class RequestValidationErrorResponse(BaseModel):
    detail: list[ValidationErrorDetail]


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
