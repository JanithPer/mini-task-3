import asyncio
import json
import logging
from collections.abc import Callable
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, TypedDict

import asyncpg

from backend.benchmark import BenchmarkRun, StrategyResult
from backend.benchmark.metrics import mrr, recall_at_k
from backend.db import close_pool, init_pool
from backend.retrieval.search import SearchParams, search

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


class StrategyConfig(TypedDict):
    label: str
    chunk_strategy: str
    hybrid: bool
    rerank: bool
    contextual: bool


STRATEGIES: list[StrategyConfig] = [
    {
        "label": "Rec+Vec",
        "chunk_strategy": "recursive",
        "hybrid": False,
        "rerank": False,
        "contextual": False,
    },
    {
        "label": "Rec+Hyb",
        "chunk_strategy": "recursive",
        "hybrid": True,
        "rerank": False,
        "contextual": False,
    },
    {
        "label": "Rec+Hyb+Rer",
        "chunk_strategy": "recursive",
        "hybrid": True,
        "rerank": True,
        "contextual": False,
    },
    {
        "label": "Sem+Vec",
        "chunk_strategy": "semantic",
        "hybrid": False,
        "rerank": False,
        "contextual": False,
    },
    {
        "label": "Sem+Hyb",
        "chunk_strategy": "semantic",
        "hybrid": True,
        "rerank": False,
        "contextual": False,
    },
    {
        "label": "Sem+Hyb+Rer",
        "chunk_strategy": "semantic",
        "hybrid": True,
        "rerank": True,
        "contextual": False,
    },
    {
        "label": "Rec+Vec+Cont",
        "chunk_strategy": "recursive",
        "hybrid": False,
        "rerank": False,
        "contextual": True,
    },
    {
        "label": "Rec+Hyb+Cont",
        "chunk_strategy": "recursive",
        "hybrid": True,
        "rerank": False,
        "contextual": True,
    },
    {
        "label": "Rec+Hyb+Rer+Cont",
        "chunk_strategy": "recursive",
        "hybrid": True,
        "rerank": True,
        "contextual": True,
    },
    {
        "label": "Sem+Vec+Cont",
        "chunk_strategy": "semantic",
        "hybrid": False,
        "rerank": False,
        "contextual": True,
    },
    {
        "label": "Sem+Hyb+Cont",
        "chunk_strategy": "semantic",
        "hybrid": True,
        "rerank": False,
        "contextual": True,
    },
    {
        "label": "Sem+Hyb+Rer+Cont",
        "chunk_strategy": "semantic",
        "hybrid": True,
        "rerank": True,
        "contextual": True,
    },
]

QUERIES_PATH = Path(__file__).parent / "queries.json"
BENCHMARK_OUTPUT_DIR = Path("data/benchmarks")
BENCHMARK_OUTPUT_FILE = BENCHMARK_OUTPUT_DIR / "latest.json"


def _load_queries() -> list[dict[str, Any]]:
    with open(QUERIES_PATH, encoding="utf-8") as f:
        return json.load(f)  # type: ignore[no-any-return]


def _build_cost_breakdown(
    per_component_totals: dict[str, float], num_queries: int
) -> dict[str, float]:
    query_rewrite = round(per_component_totals.get("query_rewrite", 0.0), 6)
    rerank = round(per_component_totals.get("rerank", 0.0), 6)
    total = round(query_rewrite + rerank, 6)
    return {
        "embedding": 0.0,
        "context_gen": 0.0,
        "query_rewrite": query_rewrite,
        "rerank": rerank,
        "total": total,
    }


async def _summarize_costs(conn: asyncpg.Connection, since: datetime) -> dict[str, float]:
    rows = await conn.fetch(
        """
        SELECT component, COALESCE(SUM(cost_usd), 0) AS total
        FROM cost_events
        WHERE occurred_at >= $1 AND component IN ('query_rewrite', 'rerank')
        GROUP BY component
        """,
        since,
    )
    return {row["component"]: float(row["total"]) for row in rows}


def _print_table(results: list[StrategyResult]) -> None:
    header = f"{'strategy':<20} {'recall@5':>9} {'recall@10':>9} {'mrr':>7} {'avg_ms':>8} {'avg_cost':>10}"
    print(header)
    print("-" * len(header))
    for r in results:
        print(
            f"{r.strategy:<20} {r.recall_5:>9.4f} {r.recall_10:>9.4f} {r.mrr:>7.4f} "
            f"{r.avg_query_time_ms:>8.1f} {r.avg_cost:>10.6f}"
        )


def _save_json(benchmark_run: BenchmarkRun) -> None:
    BENCHMARK_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "run_at": benchmark_run.run_at,
        "results": [
            {
                "strategy": r.strategy,
                "recall_5": r.recall_5,
                "recall_10": r.recall_10,
                "mrr": r.mrr,
                "avg_query_time_ms": r.avg_query_time_ms,
                "avg_cost": r.avg_cost,
                "cost_breakdown": r.cost_breakdown,
            }
            for r in benchmark_run.results
        ],
    }
    with open(BENCHMARK_OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)


async def run_benchmark(
    conn: asyncpg.Connection,
    *,
    progress_cb: Callable[[int, int], object] | None = None,
    cancel_event: asyncio.Event | None = None,
) -> BenchmarkRun:
    queries = _load_queries()
    num_queries = len(queries)
    now_dt = datetime.now(UTC)
    now_iso = now_dt.isoformat()

    total_combos = len(STRATEGIES) * num_queries
    done = 0

    logger.info(
        f"Running benchmark: {len(STRATEGIES)} strategies × {num_queries} queries = {total_combos} calls"
    )

    strategy_results: list[StrategyResult] = []
    failed_queries = 0

    for strat in STRATEGIES:
        label = strat["label"]
        strategy_start_dt = datetime.now(UTC)
        logger.info(f"[{label}] Starting...")

        recalls_5: list[float] = []
        recalls_10: list[float] = []
        mrrs: list[float] = []
        times: list[float] = []

        for q in queries:
            gold_key = f"golden_chunks_{strat['chunk_strategy']}"
            gold = set(q.get(gold_key, q.get("golden_chunks", [])))

            params = SearchParams(
                query=q["query"],
                chunk_strategy=strat["chunk_strategy"],
                hybrid=strat["hybrid"],
                rerank=strat["rerank"],
                contextual=strat["contextual"],
                top_k=10,
            )

            try:
                response = await search(conn, params)
                retrieved_ids = [r.chunk_id for r in response.results]

                recalls_5.append(recall_at_k(retrieved_ids, gold, 5))
                recalls_10.append(recall_at_k(retrieved_ids, gold, 10))
                mrrs.append(mrr(retrieved_ids, gold))
                times.append(response.elapsed_ms)
            except Exception as exc:
                logger.error(f"[{label}] Query '{q['id']}' failed: {exc}")
                recalls_5.append(0.0)
                recalls_10.append(0.0)
                mrrs.append(0.0)
                times.append(0.0)
                failed_queries += 1

            done += 1
            if callable(progress_cb):
                progress_cb(done, total_combos)

            if cancel_event and cancel_event.is_set():
                logger.info(f"[{label}] Cancelled at query {done}/{total_combos}")
                break

        if cancel_event and cancel_event.is_set():
            strategy_results.append(
                StrategyResult(
                    strategy=label,
                    recall_5=0.0,
                    recall_10=0.0,
                    mrr=0.0,
                    avg_query_time_ms=0.0,
                    avg_cost=0.0,
                    cost_breakdown={},
                )
            )
            logger.info(f"[{label}] Skipped (cancelled)")
            break

        avg_recall_5 = sum(recalls_5) / num_queries
        avg_recall_10 = sum(recalls_10) / num_queries
        avg_mrr = sum(mrrs) / num_queries
        avg_time = sum(times) / num_queries

        component_totals = await _summarize_costs(conn, strategy_start_dt)
        cost_bd = _build_cost_breakdown(component_totals, num_queries)
        avg_cost = round(cost_bd["total"] / num_queries, 6) if num_queries else 0.0

        result = StrategyResult(
            strategy=label,
            recall_5=round(avg_recall_5, 4),
            recall_10=round(avg_recall_10, 4),
            mrr=round(avg_mrr, 4),
            avg_query_time_ms=round(avg_time, 2),
            avg_cost=avg_cost,
            cost_breakdown=cost_bd,
        )
        strategy_results.append(result)
        logger.info(
            f"[{label}] R@5={avg_recall_5:.4f} R@10={avg_recall_10:.4f} "
            f"MRR={avg_mrr:.4f} avg_ms={avg_time:.1f} avg_cost={avg_cost:.6f}"
        )

        await conn.execute(
            "DELETE FROM benchmark_runs WHERE strategy = $1",
            result.strategy,
        )

        await conn.execute(
            """INSERT INTO benchmark_runs (run_at, strategy, results, cost_breakdown)
               VALUES ($1::timestamptz, $2, $3::jsonb, $4::jsonb)""",
            now_dt,
            result.strategy,
            json.dumps(
                {
                    "recall_5": result.recall_5,
                    "recall_10": result.recall_10,
                    "mrr": result.mrr,
                    "avg_query_time_ms": result.avg_query_time_ms,
                    "avg_cost": result.avg_cost,
                }
            ),
            json.dumps(result.cost_breakdown),
        )

    benchmark_run = BenchmarkRun(results=strategy_results, run_at=now_iso, failed_queries=failed_queries)
    return benchmark_run


async def _main() -> None:
    pool = await init_pool()
    try:
        async with pool.acquire() as conn:
            benchmark_run = await run_benchmark(conn)
        _print_table(benchmark_run.results)
        _save_json(benchmark_run)
        logger.info(f"Results saved to {BENCHMARK_OUTPUT_FILE}")
    finally:
        await close_pool()


if __name__ == "__main__":
    asyncio.run(_main())
