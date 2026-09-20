from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.domain.note import NoteCategory, NotePriority, NoteTitle

UnactionableReason = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)
]


class ExtractedNoteData(BaseModel):
    is_actionable: Literal[True] = Field(
        default=True,
        description="True when the source text contains an actionable fleet issue.",
    )
    title: NoteTitle = Field(
        description=(
            "A short factual title using only information present in the source text."
        )
    )
    category: NoteCategory = Field(
        description=(
            "The primary category: mechanical for physical components, wear, damage, "
            "engines, brakes, suspension, or tyres; electrical for wiring, batteries, "
            "power systems, sensors, or electrical hardware; software for firmware, "
            "telemetry software, applications, connectivity, or software behaviour; "
            "safety when continued operation may be unsafe; otherwise other."
        )
    )
    priority: NotePriority = Field(
        description=(
            "The operational urgency: critical for an immediate safety risk or when the "
            "vehicle must not continue operating; high for likely operational impact or "
            "a worsening failure that needs prompt attention; medium when the issue "
            "should be addressed soon but operations can continue cautiously; low for "
            "minor, informational, or routine work."
        )
    )

    model_config = ConfigDict(frozen=True)


class UnactionableExtraction(BaseModel):
    is_actionable: Literal[False] = Field(
        default=False,
        description=(
            "False only when the source text is clearly irrelevant or incomprehensible."
        ),
    )
    reason: UnactionableReason = Field(
        description="A brief reason why no actionable fleet issue was found."
    )

    model_config = ConfigDict(frozen=True)


ExtractionResult = Annotated[
    ExtractedNoteData | UnactionableExtraction,
    Field(discriminator="is_actionable"),
]
