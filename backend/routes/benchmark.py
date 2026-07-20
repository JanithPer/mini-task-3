import asyncio
import json
import logging
import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, Literal

from fastapi import APIRouter, HTTPException

from backend.db import get_pool
from backend.models import BenchmarkResponse, BenchmarkResult, BenchmarkStatus, CancelRequest

router = APIRouter(tags=["benchmark"])
logger = logging.getLogger(__name__)

NUM_BENCHMARK_QUERIES = 50
NUM_STRATEGIES = 12
TOTAL_BENCHMARK_UNITS = NUM_STRATEGIES * NUM_BENCHMARK_QUERIES

StatusLiteral = Literal["pending", "running", "completed", "failed", "cancelled"]


@dataclass
class _RunState:
    run_id: str
    status: str
    progress: int
    total: int
    message: str | None
    started_at: datetime
    finished_at: datetime | None
    cancel_event: asyncio.Event = field(default_factory=asyncio.Event)
    task: asyncio.Task[Any] | None = None


_runs: dict[str, _RunState] = {}


def _map_status(raw_status: str) -> StatusLiteral:
    mapping: dict[str, str] = {
        "pending": "pending",
        "running": "running",
        "completed": "completed",
        "failed": "failed",
        "cancelled": "cancelled",
    }
    return mapping.get(raw_status, "failed")  # type: ignore[return-value]


@router.post("/benchmark")
async def start_benchmark() -> dict[str, str]:
    run_id = str(uuid.uuid4())
    now = datetime.now(UTC)

    state = _RunState(
        run_id=run_id,
        status="pending",
        progress=0,
        total=TOTAL_BENCHMARK_UNITS,
        message="Benchmark queued...",
        started_at=now,
        finished_at=None,
    )
    _runs[run_id] = state

    state.task = asyncio.ensure_future(_run_benchmark_bg(state))

    return {"run_id": run_id}


async def _run_benchmark_bg(state: _RunState) -> None:
    try:
        state.status = "running"
        state.message = "Running benchmark strategies..."

        from backend.benchmark.runner import run_benchmark

        pool = get_pool()

        def progress_cb(done: int, total: int) -> None:
            state.progress = done
            state.total = total
            if state.cancel_event.is_set():
                raise asyncio.CancelledError()

        async with pool.acquire() as conn:
            await run_benchmark(
                conn,
                progress_cb=progress_cb,
                cancel_event=state.cancel_event,
            )

        state.status = "completed"
        state.progress = state.total
        state.message = "Benchmark complete"
        state.finished_at = datetime.now(UTC)

    except asyncio.CancelledError:
        state.status = "cancelled"
        state.message = "Benchmark cancelled by user"
        state.finished_at = datetime.now(UTC)
    except Exception as e:
        logger.error("Benchmark failed: %s", e)
        state.status = "failed"
        state.message = str(e)[:500]
        state.finished_at = datetime.now(UTC)


@router.get("/benchmark/status/{run_id}", response_model=BenchmarkStatus)
async def get_benchmark_status(run_id: str) -> BenchmarkStatus:
    state = _runs.get(run_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Benchmark run not found")
    return BenchmarkStatus(
        run_id=state.run_id,
        status=_map_status(state.status),
        progress=state.progress,
        total=state.total,
        message=state.message,
        started_at=state.started_at,
        finished_at=state.finished_at,
    )


@router.get("/benchmark/results", response_model=BenchmarkResponse)
async def get_benchmark_results() -> BenchmarkResponse:
    pool = get_pool()
    async with pool.acquire() as conn:
        run_at_row = await conn.fetchrow(
            "SELECT run_at FROM benchmark_runs ORDER BY run_at DESC LIMIT 1"
        )

        if run_at_row is None:
            return BenchmarkResponse(results=[], run_at=None)

        latest_run_at = run_at_row["run_at"]
        rows = await conn.fetch(
            "SELECT strategy, results, cost_breakdown FROM benchmark_runs WHERE run_at = $1",
            latest_run_at,
        )

    results: list[BenchmarkResult] = []
    for row in rows:
        res = json.loads(row["results"]) if isinstance(row["results"], str) else row["results"]
        cost_bd = (
            json.loads(row["cost_breakdown"])
            if isinstance(row["cost_breakdown"], str)
            else row["cost_breakdown"]
        )
        avg_cost = round(float(cost_bd.get("total", 0)) / NUM_BENCHMARK_QUERIES, 6)

        results.append(
            BenchmarkResult(
                strategy=row["strategy"],
                recall_5=res["recall_5"],
                recall_10=res["recall_10"],
                mrr=res["mrr"],
                avg_query_time_ms=res["avg_query_time_ms"],
                avg_cost=avg_cost,
            )
        )

    return BenchmarkResponse(results=results, run_at=latest_run_at)


@router.post("/benchmark/cancel")
async def cancel_benchmark(payload: CancelRequest) -> dict[str, str]:
    state = _runs.get(payload.run_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Benchmark run not found")

    if state.status in ("completed", "failed", "cancelled"):
        return {"status": "ok"}

    state.cancel_event.set()
    if state.task and not state.task.done():
        state.task.cancel()

    return {"status": "ok"}
