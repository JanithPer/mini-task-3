from dataclasses import dataclass
from datetime import datetime

import asyncpg
import tiktoken

GPT4O_MINI_IN_PER_1M = 0.15
GPT4O_MINI_OUT_PER_1M = 0.60

OPENAI_MODELS = {
    "gpt-4o-mini": "o200k_base",
    "gpt-4o": "o200k_base",
    "gpt-3.5-turbo": "cl100k_base",
}


@dataclass
class CostBreakdown:
    embedding: float = 0.0
    context_gen: float = 0.0
    query_rewrite: float = 0.0
    rerank: float = 0.0
    total: float = 0.0


@dataclass
class ComponentRow:
    component: str
    tokens_in: int
    tokens_out: int
    cost: float


def cost_embedding(tokens_in: int) -> float:
    return 0.0


def cost_context_gen(tokens_in: int, tokens_out: int) -> float:
    return (tokens_in / 1_000_000) * GPT4O_MINI_IN_PER_1M + (
        tokens_out / 1_000_000
    ) * GPT4O_MINI_OUT_PER_1M


def cost_query_rewrite(tokens_in: int, tokens_out: int) -> float:
    return (tokens_in / 1_000_000) * GPT4O_MINI_IN_PER_1M + (
        tokens_out / 1_000_000
    ) * GPT4O_MINI_OUT_PER_1M


def cost_rerank(units: int) -> float:
    return 0.0


def count_tokens(model: str, text: str) -> int:
    enc_name = OPENAI_MODELS.get(model)
    if enc_name is None:
        raise ValueError(f"Unknown model for token counting: {model}")
    enc = tiktoken.get_encoding(enc_name)
    return len(enc.encode(text))


async def ingestion_cost_per_1k_pages(conn: asyncpg.Connection) -> CostBreakdown:
    row = await conn.fetchrow(
        """
        SELECT
            COALESCE(SUM(CASE WHEN component = 'embedding' THEN cost_usd ELSE 0 END), 0) AS embedding,
            COALESCE(SUM(CASE WHEN component = 'context_gen' THEN cost_usd ELSE 0 END), 0) AS context_gen
        FROM cost_events
        WHERE component IN ('embedding', 'context_gen')
        """
    )
    embedding = float(row["embedding"]) if row else 0.0
    context_gen = float(row["context_gen"]) if row else 0.0

    doc_count_row = await conn.fetchrow("SELECT COUNT(*)::int AS cnt FROM documents")
    doc_count = doc_count_row["cnt"] if doc_count_row else 0

    if doc_count == 0:
        return CostBreakdown(embedding=0.0, context_gen=0.0, total=0.0)

    scale = 1000 / doc_count
    embedding_per_1k = round(embedding * scale, 6)
    context_gen_per_1k = round(context_gen * scale, 6)

    return CostBreakdown(
        embedding=embedding_per_1k,
        context_gen=context_gen_per_1k,
        total=round(embedding_per_1k + context_gen_per_1k, 6),
    )


async def avg_query_cost(
    conn: asyncpg.Connection, *, last_n_runs: int = 1
) -> CostBreakdown:
    recent_runs = await conn.fetch(
        """
        SELECT run_at FROM benchmark_runs
        GROUP BY run_at
        ORDER BY run_at DESC
        LIMIT $1
        """,
        last_n_runs,
    )

    if not recent_runs:
        return CostBreakdown()

    oldest_run = recent_runs[-1]["run_at"]
    newest_run = recent_runs[0]["run_at"]

    row = await conn.fetchrow(
        """
        SELECT
            COALESCE(SUM(CASE WHEN component = 'embedding' THEN cost_usd ELSE 0 END), 0) AS embedding,
            COALESCE(SUM(CASE WHEN component = 'query_rewrite' THEN cost_usd ELSE 0 END), 0) AS query_rewrite,
            COALESCE(SUM(CASE WHEN component = 'rerank' THEN cost_usd ELSE 0 END), 0) AS rerank
        FROM cost_events
        WHERE component IN ('embedding', 'query_rewrite', 'rerank')
          AND occurred_at >= $1
          AND occurred_at <= $2
        """,
        oldest_run,
        newest_run,
    )

    embedding = float(row["embedding"]) if row else 0.0
    query_rewrite = float(row["query_rewrite"]) if row else 0.0
    rerank = float(row["rerank"]) if row else 0.0

    query_count_row = await conn.fetchrow(
        """
        SELECT COUNT(*)::int AS cnt FROM benchmark_runs
        WHERE run_at >= $1 AND run_at <= $2
        """,
        oldest_run,
        newest_run,
    )
    query_count = query_count_row["cnt"] if query_count_row else 0

    if query_count == 0:
        return CostBreakdown()

    divisor = query_count * 50  # 50 benchmark queries per strategy
    return CostBreakdown(
        embedding=round(embedding / divisor, 6),
        query_rewrite=round(query_rewrite / divisor, 6),
        rerank=round(rerank / divisor, 6),
        total=round((embedding + query_rewrite + rerank) / divisor, 6),
    )


async def cost_table(conn: asyncpg.Connection) -> list[ComponentRow]:
    rows = await conn.fetch(
        """
        SELECT
            component,
            COALESCE(SUM(tokens_in), 0)::bigint AS tokens_in,
            COALESCE(SUM(tokens_out), 0)::bigint AS tokens_out,
            COALESCE(SUM(cost_usd), 0)::numeric AS cost
        FROM cost_events
        GROUP BY component
        ORDER BY component
        """
    )
    return [
        ComponentRow(
            component=row["component"],
            tokens_in=row["tokens_in"],
            tokens_out=row["tokens_out"],
            cost=round(float(row["cost"]), 6),
        )
        for row in rows
    ]


async def last_ingested_at(conn: asyncpg.Connection) -> str | None:
    row = await conn.fetchrow(
        "SELECT finished_at FROM ingestion_tasks WHERE status = 'complete' ORDER BY finished_at DESC LIMIT 1"
    )
    if row and row["finished_at"]:
        if isinstance(row["finished_at"], datetime):
            return row["finished_at"].isoformat()
        return str(row["finished_at"])
    return None
