from collections.abc import Callable
from datetime import UTC, datetime
from uuid import UUID, uuid4

from pydantic import TypeAdapter

from app.application.errors import SourceTextNotActionable
from app.domain.extraction import UnactionableExtraction
from app.domain.note import Note, SourceText
from app.ports import NoteExtractor, NoteRepository

_SOURCE_TEXT_ADAPTER = TypeAdapter(SourceText)


def _utc_now() -> datetime:
    return datetime.now(UTC)


def submit_note(
    source_text: str,
    *,
    extractor: NoteExtractor,
    repository: NoteRepository,
    id_factory: Callable[[], UUID] = uuid4,
    clock: Callable[[], datetime] = _utc_now,
) -> Note:
    validated_source_text = _SOURCE_TEXT_ADAPTER.validate_python(source_text)
    extraction = extractor.extract(validated_source_text)
    if isinstance(extraction, UnactionableExtraction):
        raise SourceTextNotActionable(extraction.reason)

    note = Note(
        id=id_factory(),
        source_text=validated_source_text,
        title=extraction.title,
        category=extraction.category,
        priority=extraction.priority,
        created_at=clock(),
    )
    repository.add(note)
    return note
