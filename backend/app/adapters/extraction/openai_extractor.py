from typing import Any, Protocol

from openai import OpenAI as OpenAIClient
from openai import OpenAIError
from pydantic import BaseModel

from app.application.errors import ExtractionUnavailable
from app.domain.extraction import (
    ExtractedNoteData,
    ExtractionResult,
    UnactionableExtraction,
)

_INSTRUCTIONS = """Extract one actionable fleet issue from the technician note.
For vague but potentially meaningful fleet issues, return an actionable result.
For compound text, return the most operationally significant issue.
Follow the structured output schema and do not add facts that are not in the note.
"""


class ExtractionResponse(BaseModel):
    result: ExtractedNoteData | UnactionableExtraction


class _OpenAIClient(Protocol):
    responses: Any


class OpenAINoteExtractor:
    def __init__(self, client: OpenAIClient | _OpenAIClient, *, model: str) -> None:
        self._client = client
        self._model = model

    def extract(self, source_text: str) -> ExtractionResult:
        try:
            response = self._client.responses.parse(
                model=self._model,
                input=[
                    {"role": "developer", "content": _INSTRUCTIONS},
                    {"role": "user", "content": source_text},
                ],
                text_format=ExtractionResponse,
            )
        except OpenAIError as error:
            raise ExtractionUnavailable("OpenAI extraction failed") from error

        parsed = response.output_parsed
        if not isinstance(parsed, ExtractionResponse):
            raise ExtractionUnavailable("OpenAI returned no structured output")
        return parsed.result
