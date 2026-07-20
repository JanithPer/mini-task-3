import asyncio
import logging
from typing import Any, Literal

import asyncpg

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from backend.db import get_pool
from backend.models import IngestionStatus

router = APIRouter(tags=["ingest"])
logger = logging.getLogger(__name__)

DB_STATUS_MAP: dict[str, str] = {
    "pending": "pending",
    "running": "running",
    "complete": "completed",
    "error": "failed",
}

StatusLiteral = Literal["pending", "running", "completed", "failed"]

_running_ingestion: asyncio.Task[Any] | None = None


def _map_status(db_status: str) -> StatusLiteral:
    return DB_STATUS_MAP.get(db_status, "failed")  # type: ignore[return-value]


def _row_to_ingestion_status(row: asyncpg.Record) -> IngestionStatus:
    return IngestionStatus(
        task_id=str(row["id"]),
        status=_map_status(row["status"]),
        progress=row["progress"],
        total=row["total"],
        message=row["message"],
        started_at=row["started_at"],
        finished_at=row["finished_at"],
    )


@router.post("/ingest")
async def start_ingestion() -> JSONResponse:
    global _running_ingestion

    pool = get_pool()
    async with pool.acquire() as conn:
        existing = await conn.fetchrow(
            "SELECT id FROM ingestion_tasks WHERE status IN ('pending', 'running') LIMIT 1"
        )
        if existing:
            return JSONResponse(
                status_code=200,
                content={"task_id": str(existing["id"])},
            )

        row = await conn.fetchrow(
            """INSERT INTO ingestion_tasks (status, progress, total, message)
               VALUES ('pending', 0, 0, 'Queued...')
               RETURNING id, started_at, status""",
        )
        task_id = str(row["id"])

    async def _run_background(tid: str) -> None:
        global _running_ingestion
        _pool = get_pool()
        try:
            from backend.ingestion.pipeline import run_ingestion

            def progress_cb(current: int, total: int) -> None:
                asyncio.ensure_future(_update_progress(tid, current, total))

            await run_ingestion(pool=_pool, task_id=tid, progress_cb=progress_cb)

        except Exception as e:
            logger.error("Background ingestion failed: %s", e)
            try:
                async with _pool.acquire() as conn:
                    await conn.execute(
                        "UPDATE ingestion_tasks SET status = 'error', message = $1, finished_at = now() WHERE id = $2",
                        str(e)[:500],
                        tid,
                    )
            except Exception:
                pass

        finally:
            _running_ingestion = None

    _running_ingestion = asyncio.ensure_future(_run_background(task_id))

    return JSONResponse(status_code=200, content={"task_id": task_id})


async def _update_progress(tid: str, current: int, total: int) -> None:
    pool = get_pool()
    try:
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE ingestion_tasks SET progress = $1, total = $2, status = CASE WHEN status = 'pending' THEN 'running' ELSE status END WHERE id = $3",
                current,
                total,
                tid,
            )
    except Exception:
        pass


@router.get("/ingest/status/{task_id}", response_model=IngestionStatus)
async def get_ingestion_status(task_id: str) -> IngestionStatus:
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, status, progress, total, message, started_at, finished_at FROM ingestion_tasks WHERE id = $1",
            task_id,
        )
    if row is None:
        raise HTTPException(status_code=404, detail="Ingestion task not found")
    return _row_to_ingestion_status(row)
