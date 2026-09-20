import logging
from typing import Any, ClassVar

import pytest

from app import dependencies
from app.adapters.extraction.openai_extractor import OpenAINoteExtractor
from app.application.errors import ExtractionUnavailable


class FakeOpenAIClient:
    options: ClassVar[dict[str, Any]] = {}

    def __init__(self, **options: Any) -> None:
        type(self).options = options


def test_note_extractor_uses_openai_settings(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "test-api-key")
    monkeypatch.setenv("OPENAI_MODEL", "test-model")
    monkeypatch.setenv("OPENAI_TIMEOUT_SECONDS", "6.5")
    monkeypatch.setattr(dependencies, "OpenAIClient", FakeOpenAIClient)
    dependencies.get_note_extractor.cache_clear()

    extractor = dependencies.get_note_extractor()

    assert isinstance(extractor, OpenAINoteExtractor)
    assert FakeOpenAIClient.options == {
        "api_key": "test-api-key",
        "timeout": 6.5,
        "max_retries": 1,
    }
    dependencies.get_note_extractor.cache_clear()


def test_note_extractor_is_unavailable_without_api_key(
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "")
    dependencies.get_note_extractor.cache_clear()

    with caplog.at_level(logging.WARNING, logger="app.dependencies"):
        extractor = dependencies.get_note_extractor()

    with pytest.raises(ExtractionUnavailable, match="API key is not configured"):
        extractor.extract("Brake pads worn")
    assert "OPENAI_API_KEY is not configured" in caplog.text
    dependencies.get_note_extractor.cache_clear()
