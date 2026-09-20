from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.domain.note import NoteCategory, NotePriority, NoteTitle

UnactionableReason = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)
]


class ExtractedNoteData(BaseModel):
    is_actionable: Literal[True] = True
    title: NoteTitle
    category: NoteCategory
    priority: NotePriority

    model_config = ConfigDict(frozen=True)


class UnactionableExtraction(BaseModel):
    is_actionable: Literal[False] = False
    reason: UnactionableReason

    model_config = ConfigDict(frozen=True)


ExtractionResult = Annotated[
    ExtractedNoteData | UnactionableExtraction,
    Field(discriminator="is_actionable"),
]
