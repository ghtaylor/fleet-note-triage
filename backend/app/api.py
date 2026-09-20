from collections.abc import Iterator
from datetime import UTC, datetime
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.adapters.persistence.repository import SqlAlchemyNoteRepository
from app.application.errors import NoteNotFound
from app.application.set_note_status import set_note_status
from app.config import Settings
from app.domain.note import NoteCategory, NotePriority, NoteStatus
from app.ports import NoteQuery, NoteRepository, NoteSortField, SortDirection

router = APIRouter()
_engine = create_engine(Settings().database_url)
_session_factory = sessionmaker(_engine)


def get_note_repository() -> Iterator[NoteRepository]:
    with _session_factory() as session:
        yield SqlAlchemyNoteRepository(session)


NoteRepositoryDependency = Annotated[
    NoteRepository,
    Depends(get_note_repository),
]


def get_current_time() -> datetime:
    return datetime.now(UTC)


CurrentTimeDependency = Annotated[datetime, Depends(get_current_time)]


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


class SetNoteStatusRequest(BaseModel):
    status: NoteStatus


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    return HealthResponse(status="ok")


@router.patch("/notes/{note_id}", response_model=NoteResponse)
def patch_note(
    note_id: UUID,
    request: SetNoteStatusRequest,
    repository: NoteRepositoryDependency,
    current_time: CurrentTimeDependency,
) -> NoteResponse:
    try:
        note = set_note_status(
            note_id,
            request.status,
            repository=repository,
            clock=lambda: current_time,
        )
    except NoteNotFound as error:
        raise HTTPException(status_code=404, detail="note_not_found") from error
    return NoteResponse.model_validate(note)


@router.get("/notes", response_model=NoteListResponse)
def get_notes(
    repository: NoteRepositoryDependency,
    category: NoteCategory | None = None,
    priority: NotePriority | None = None,
    status: NoteStatus | None = None,
    sort_by: NoteSortField = NoteSortField.PRIORITY,
    direction: SortDirection = SortDirection.DESC,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> NoteListResponse:
    page = repository.list_notes(
        NoteQuery(
            category=category,
            priority=priority,
            status=status,
            sort_by=sort_by,
            direction=direction,
            limit=limit,
            offset=offset,
        )
    )
    return NoteListResponse(
        items=[NoteResponse.model_validate(note) for note in page.items],
        total=page.total,
    )
