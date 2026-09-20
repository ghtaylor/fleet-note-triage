from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_note_repository
from app.main import app
from app.ports import NotePage, NoteQuery
from test_support.fakes import FakeNoteRepository


class FailingNoteRepository(FakeNoteRepository):
    def list_notes(self, query: NoteQuery) -> NotePage:
        raise RuntimeError("database unavailable")


@pytest.fixture
def client() -> Iterator[TestClient]:
    app.dependency_overrides[get_note_repository] = lambda: FailingNoteRepository()
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_unexpected_error_returns_safe_error_code(client: TestClient) -> None:
    response = client.get("/notes")

    assert response.status_code == 500
    assert response.json() == {"detail": "internal_server_error"}


def test_openapi_documents_unexpected_server_errors() -> None:
    schema = app.openapi()

    assert schema["paths"]["/notes"]["get"]["responses"]["500"]["content"][
        "application/json"
    ]["schema"] == {"$ref": "#/components/schemas/ErrorResponse"}


def test_openapi_documents_extraction_unavailable_errors() -> None:
    schema = app.openapi()

    assert schema["paths"]["/notes"]["post"]["responses"]["503"]["content"][
        "application/json"
    ]["schema"] == {"$ref": "#/components/schemas/ErrorResponse"}


def test_openapi_documents_both_unprocessable_content_errors() -> None:
    schema = app.openapi()

    response_schema = schema["paths"]["/notes"]["post"]["responses"]["422"][
        "content"
    ]["application/json"]["schema"]
    assert response_schema["anyOf"] == [
        {"$ref": "#/components/schemas/ErrorResponse"},
        {"$ref": "#/components/schemas/RequestValidationErrorResponse"},
    ]


def test_openapi_documents_note_not_found_errors() -> None:
    schema = app.openapi()

    assert schema["paths"]["/notes/{note_id}"]["patch"]["responses"]["404"][
        "content"
    ]["application/json"]["schema"] == {
        "$ref": "#/components/schemas/ErrorResponse"
    }
