import asyncio
import time
from dataclasses import dataclass

import asyncpg

from backend.retrieval import ScoredChunk
from backend.retrieval.hybrid import hybrid_search
from backend.retrieval.query_rewrite import rewrite_query
from backend.retrieval.rerank import rerank
from backend.retrieval.vector_search import vector_search

VALID_STRATEGIES = {"recursive", "semantic"}
MIN_TOP_K = 5
MAX_TOP_K = 50


@dataclass
class SearchParams:
    query: str
    chunk_strategy: str
    hybrid: bool
    rerank: bool
    contextual: bool
    top_k: int


@dataclass
class SearchResult:
    rank: int
    chunk_id: str
    content: str
    contextualized_content: str | None
    score: float
    document_title: str
    arxiv_id: str
    chunk_strategy: str


@dataclass
class SearchResponse:
    results: list[SearchResult]
    elapsed_ms: float
    query: str
    params_applied: SearchParams


def _validate_params(params: SearchParams) -> None:
    if params.top_k < MIN_TOP_K or params.top_k > MAX_TOP_K:
        raise ValueError(f"top_k must be between {MIN_TOP_K} and {MAX_TOP_K}")
    if params.chunk_strategy not in VALID_STRATEGIES:
        raise ValueError(f"chunk_strategy must be one of {VALID_STRATEGIES}")


def _chunk_to_result(chunk: ScoredChunk, rank: int) -> SearchResult:
    return SearchResult(
        rank=rank,
        chunk_id=str(chunk.id),
        content=chunk.content,
        contextualized_content=chunk.contextualized_content,
        score=chunk.score,
        document_title=chunk.document_title,
        arxiv_id=chunk.arxiv_id,
        chunk_strategy=chunk.strategy,
    )


async def search(
    conn: asyncpg.Connection,
    params: SearchParams,
    *,
    cancel_event: asyncio.Event | None = None,
) -> SearchResponse:
    if isinstance(params, dict):
        params = SearchParams(**params)

    _validate_params(params)

    start = time.monotonic()

    rewrites = await rewrite_query(params.query, n=3, conn=conn)

    if cancel_event and cancel_event.is_set():
        elapsed_ms = (time.monotonic() - start) * 1000
        return SearchResponse(
            results=[],
            elapsed_ms=round(elapsed_ms, 2),
            query=params.query,
            params_applied=params,
        )

    if params.hybrid:
        chunks = await hybrid_search(
            conn,
            params.query,
            top_k=params.top_k,
            strategy=params.chunk_strategy,
            contextual=params.contextual,
            k=60,
            fts_queries=rewrites,
        )
    else:
        chunks = await vector_search(
            conn,
            params.query,
            top_k=params.top_k,
            strategy=params.chunk_strategy,
            contextual=params.contextual,
        )

    if cancel_event and cancel_event.is_set():
        elapsed_ms = (time.monotonic() - start) * 1000
        return SearchResponse(
            results=[],
            elapsed_ms=round(elapsed_ms, 2),
            query=params.query,
            params_applied=params,
        )

    if params.rerank and chunks:
        chunks = await rerank(params.query, chunks, top_n=params.top_k, conn=conn)

    elapsed_ms = (time.monotonic() - start) * 1000

    results = [
        _chunk_to_result(chunk, rank=i + 1)
        for i, chunk in enumerate(chunks)
    ]

    return SearchResponse(
        results=results,
        elapsed_ms=round(elapsed_ms, 2),
        query=params.query,
        params_applied=params,
    )
