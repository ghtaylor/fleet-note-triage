import logging
from collections.abc import Iterator
from datetime import UTC, datetime
from functools import cache
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import Depends
from openai import OpenAI as OpenAIClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.adapters.extraction.openai_extractor import OpenAINoteExtractor
from app.adapters.persistence.repository import SqlAlchemyNoteRepository
from app.application.errors import ExtractionUnavailable
from app.config import Settings
from app.domain.extraction import ExtractionResult
from app.ports import NoteExtractor, NoteRepository

logger = logging.getLogger(__name__)

_engine = create_engine(Settings().database_url)
_session_factory = sessionmaker(_engine)


def get_note_repository() -> Iterator[NoteRepository]:
    with _session_factory.begin() as session:
        yield SqlAlchemyNoteRepository(session)


NoteRepositoryDependency = Annotated[
    NoteRepository,
    Depends(get_note_repository, scope="function"),
]


class _UnavailableNoteExtractor:
    def extract(self, source_text: str) -> ExtractionResult:
        raise ExtractionUnavailable("OpenAI API key is not configured")


@cache
def get_note_extractor() -> NoteExtractor:
    settings = Settings()
    if settings.openai_api_key is None:
        logger.warning(
            "OPENAI_API_KEY is not configured; note submission is unavailable"
        )
        return _UnavailableNoteExtractor()

    logger.info("Configuring note extraction with model %s", settings.openai_model)
    client = OpenAIClient(
        api_key=settings.openai_api_key.get_secret_value(),
        timeout=settings.openai_timeout_seconds,
        max_retries=1,
    )
    return OpenAINoteExtractor(client, model=settings.openai_model)


NoteExtractorDependency = Annotated[NoteExtractor, Depends(get_note_extractor)]


def get_note_id() -> UUID:
    return uuid4()


NoteIdDependency = Annotated[UUID, Depends(get_note_id)]


def get_current_time() -> datetime:
    return datetime.now(UTC)


CurrentTimeDependency = Annotated[datetime, Depends(get_current_time)]
