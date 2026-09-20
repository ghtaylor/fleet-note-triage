from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.application.errors import (
    ExtractionUnavailable,
    NoteNotFound,
    SourceTextNotActionable,
)
from app.application.set_note_status import set_note_status
from app.application.submit_note import submit_note
from app.dependencies import (
    CurrentTimeDependency,
    NoteExtractorDependency,
    NoteIdDependency,
    NoteRepositoryDependency,
)
from app.domain.note import NoteCategory, NotePriority, NoteStatus
from app.ports import NoteQuery, NoteSortField, SortDirection
from app.schemas import (
    HealthResponse,
    NoteListResponse,
    NoteResponse,
    SetNoteStatusRequest,
    SubmitNoteRequest,
)

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    return HealthResponse(status="ok")


@router.post("/notes", response_model=NoteResponse, status_code=201)
def post_note(
    request: SubmitNoteRequest,
    extractor: NoteExtractorDependency,
    repository: NoteRepositoryDependency,
    note_id: NoteIdDependency,
    current_time: CurrentTimeDependency,
) -> NoteResponse:
    try:
        note = submit_note(
            request.source_text,
            extractor=extractor,
            repository=repository,
            id_factory=lambda: note_id,
            clock=lambda: current_time,
        )
    except SourceTextNotActionable as error:
        raise HTTPException(
            status_code=422,
            detail="source_text_not_actionable",
        ) from error
    except ExtractionUnavailable as error:
        raise HTTPException(status_code=503, detail="extraction_unavailable") from error
    return NoteResponse.model_validate(note)


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
