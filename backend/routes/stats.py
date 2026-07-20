from fastapi import APIRouter

from backend.cost import CostBreakdown as BackendCostBreakdown
from backend.cost import avg_query_cost, cost_table, ingestion_cost_per_1k_pages, last_ingested_at
from backend.db import get_pool
from backend.models import CostBreakdown, StatsData

router = APIRouter(tags=["stats"])


def _to_api_cost(backend_cost: BackendCostBreakdown) -> CostBreakdown:
    return CostBreakdown(
        embedding=backend_cost.embedding,
        context_gen=backend_cost.context_gen,
        query_rewrite=backend_cost.query_rewrite,
        rerank=backend_cost.rerank,
        total=backend_cost.total,
    )


@router.get("/stats", response_model=StatsData)
async def get_stats() -> StatsData:
    pool = get_pool()
    async with pool.acquire() as conn:
        doc_count_row = await conn.fetchrow("SELECT COUNT(*)::int AS cnt FROM documents")
        chunk_count_row = await conn.fetchrow("SELECT COUNT(*)::int AS cnt FROM chunks")
        total_documents: int = doc_count_row["cnt"] if doc_count_row else 0
        total_chunks: int = chunk_count_row["cnt"] if chunk_count_row else 0

        last_ts = await last_ingested_at(conn)
        ingestion_cost = await ingestion_cost_per_1k_pages(conn)
        query_cost = await avg_query_cost(conn)

    return StatsData(
        total_documents=total_documents,
        total_chunks=total_chunks,
        last_ingested_at=last_ts,  # type: ignore[arg-type]
        ingestion_cost_per_1k=_to_api_cost(ingestion_cost),
        avg_query_cost=_to_api_cost(query_cost),
    )


@router.get("/stats/detail")
async def get_stats_detail() -> list[dict[str, object]]:
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await cost_table(conn)
    return [
        {
            "component": r.component,
            "tokens_in": r.tokens_in,
            "tokens_out": r.tokens_out,
            "cost": r.cost,
        }
        for r in rows
    ]
