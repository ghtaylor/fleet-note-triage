from datetime import datetime
from enum import Enum as PythonEnum

from sqlalchemy import DateTime, String, Text
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.domain.note import NoteCategory, NotePriority


def _enum_values(enum_type: type[PythonEnum]) -> list[str]:
    return [str(member.value) for member in enum_type]


class Base(DeclarativeBase):
    pass


class NoteRecord(Base):
    __tablename__ = "notes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    source_text: Mapped[str] = mapped_column(Text)
    title: Mapped[str] = mapped_column(String(100))
    category: Mapped[NoteCategory] = mapped_column(
        SqlEnum(
            NoteCategory,
            name="note_category",
            native_enum=False,
            create_constraint=True,
            validate_strings=True,
            values_callable=_enum_values,
        )
    )
    priority: Mapped[NotePriority] = mapped_column(
        SqlEnum(
            NotePriority,
            name="note_priority",
            native_enum=False,
            create_constraint=True,
            validate_strings=True,
            values_callable=_enum_values,
        )
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
