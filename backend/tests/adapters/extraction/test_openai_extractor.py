from dataclasses import dataclass
from typing import Any

import httpx2
import pytest
from openai import APIConnectionError
from pydantic import BaseModel

from app.adapters.extraction.openai_extractor import OpenAINoteExtractor
from app.application.errors import ExtractionUnavailable
from app.domain.extraction import (
    ExtractedNoteData,
    ExtractionResult,
    UnactionableExtraction,
)
from app.domain.note import NoteCategory, NotePriority


@dataclass
class FakeParsedResponse:
    output_parsed: BaseModel | None


class FakeResponses:
    def __init__(
        self,
        outcome: FakeParsedResponse | Exception,
    ) -> None:
        self.outcome = outcome
        self.requests: list[dict[str, Any]] = []

    def parse(self, **request: Any) -> FakeParsedResponse:
        self.requests.append(request)
        if isinstance(self.outcome, Exception):
            raise self.outcome
        return self.outcome


class FakeOpenAIClient:
    def __init__(self, responses: FakeResponses) -> None:
        self.responses = responses


def parsed_response(result: ExtractionResult) -> FakeParsedResponse:
    from app.adapters.extraction.openai_extractor import ExtractionResponse

    return FakeParsedResponse(output_parsed=ExtractionResponse(root=result))


def test_extract_returns_actionable_data() -> None:
    expected = ExtractedNoteData(
        title="Worn brake pads on car 12",
        category=NoteCategory.MECHANICAL,
        priority=NotePriority.HIGH,
    )
    responses = FakeResponses(parsed_response(expected))
    extractor = OpenAINoteExtractor(FakeOpenAIClient(responses), model="gpt-5.6-luna")

    result = extractor.extract("Brake pads worn on car 12")

    assert result == expected


def test_extract_returns_unactionable_result() -> None:
    expected = UnactionableExtraction(reason="No fleet issue found")
    responses = FakeResponses(parsed_response(expected))
    extractor = OpenAINoteExtractor(FakeOpenAIClient(responses), model="gpt-5.6-luna")

    result = extractor.extract("Thanks for your help")

    assert result == expected


def test_extract_requests_structured_output() -> None:
    responses = FakeResponses(
        parsed_response(UnactionableExtraction(reason="No fleet issue found"))
    )
    extractor = OpenAINoteExtractor(FakeOpenAIClient(responses), model="gpt-5.6-luna")

    extractor.extract("Thanks for your help")

    request = responses.requests[0]
    assert request["model"] == "gpt-5.6-luna"
    assert request["input"][-1] == {
        "role": "user",
        "content": "Thanks for your help",
    }
    assert request["text_format"].__name__ == "ExtractionResponse"


def test_extract_translates_provider_failure() -> None:
    provider_error = APIConnectionError(
        request=httpx2.Request("POST", "https://api.openai.com")
    )
    responses = FakeResponses(provider_error)
    extractor = OpenAINoteExtractor(FakeOpenAIClient(responses), model="gpt-5.6-luna")

    with pytest.raises(ExtractionUnavailable, match="OpenAI extraction failed"):
        extractor.extract("Brake pads worn on car 12")


def test_extract_rejects_response_without_parsed_output() -> None:
    responses = FakeResponses(FakeParsedResponse(output_parsed=None))
    extractor = OpenAINoteExtractor(FakeOpenAIClient(responses), model="gpt-5.6-luna")

    with pytest.raises(ExtractionUnavailable, match="no structured output"):
        extractor.extract("Brake pads worn on car 12")
