import pytest

from app.ports import NoteQuery


@pytest.mark.parametrize("limit", [0, 101])
def test_note_query_rejects_limit_outside_bounds(limit: int) -> None:
    with pytest.raises(ValueError, match="limit must be between 1 and 100"):
        NoteQuery(limit=limit)


def test_note_query_rejects_negative_offset() -> None:
    with pytest.raises(ValueError, match="offset must be at least 0"):
        NoteQuery(offset=-1)
