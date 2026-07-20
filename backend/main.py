import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.db import close_pool, get_pool, init_pool
from backend.routes import routers

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    await init_pool()
    logger.info("Database pool initialized")
    yield
    await close_pool()
    logger.info("Database pool closed")


app = FastAPI(
    title="Retrieval Engine",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in routers:
    app.include_router(router, prefix="/api")


@app.exception_handler(Exception)
async def global_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    logger.error("Unhandled error: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "internal_error", "message": str(exc)}},
    )


@app.get("/healthz")
async def healthz() -> dict[str, object]:
    db_ok = False
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            await conn.execute("SELECT 1")
        db_ok = True
    except Exception:
        pass
    return {"ok": True, "db": db_ok}
