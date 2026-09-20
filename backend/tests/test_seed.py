from app.seed import SAMPLE_NOTES, seed_notes
from test_support.fakes import FakeNoteRepository


def test_seed_notes_does_not_duplicate_sample_notes() -> None:
    repository = FakeNoteRepository()

    assert seed_notes(repository) == len(SAMPLE_NOTES)
    assert seed_notes(repository) == 0
    assert repository.notes == list(SAMPLE_NOTES)
