import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api import router
from app.schemas import ErrorResponse

logger = logging.getLogger(__name__)

app = FastAPI()
app.include_router(router)


@app.exception_handler(Exception)
async def handle_unexpected_error(
    _request: Request,
    _error: Exception,
) -> JSONResponse:
    logger.exception("Unhandled API error")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(detail="internal_server_error").model_dump(),
    )
