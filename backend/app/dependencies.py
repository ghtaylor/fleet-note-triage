from collections.abc import Iterator
from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import Depends, HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.adapters.persistence.repository import SqlAlchemyNoteRepository
from app.config import Settings
from app.ports import NoteExtractor, NoteRepository

_engine = create_engine(Settings().database_url)
_session_factory = sessionmaker(_engine)


def get_note_repository() -> Iterator[NoteRepository]:
    with _session_factory() as session:
        yield SqlAlchemyNoteRepository(session)


NoteRepositoryDependency = Annotated[
    NoteRepository,
    Depends(get_note_repository),
]


def get_note_extractor() -> NoteExtractor:
    raise HTTPException(status_code=503, detail="extraction_unavailable")


NoteExtractorDependency = Annotated[NoteExtractor, Depends(get_note_extractor)]


def get_note_id() -> UUID:
    return uuid4()


NoteIdDependency = Annotated[UUID, Depends(get_note_id)]


def get_current_time() -> datetime:
    return datetime.now(UTC)


CurrentTimeDependency = Annotated[datetime, Depends(get_current_time)]
