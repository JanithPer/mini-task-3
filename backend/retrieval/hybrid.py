import asyncio

import asyncpg

from backend.retrieval import ScoredChunk
from backend.retrieval.fts_search import fts_search
from backend.retrieval.vector_search import vector_search


def _rrf_fuse(
    results_a: list[ScoredChunk],
    results_b: list[ScoredChunk],
    k: int = 60,
) -> list[ScoredChunk]:
    scores: dict[int, tuple[float, ScoredChunk]] = {}

    for rank, chunk in enumerate(results_a, start=1):
        rrf = 1.0 / (k + rank)
        if chunk.id in scores:
            rrf = max(rrf, scores[chunk.id][0])
        chunk.score = rrf
        scores[chunk.id] = (rrf, chunk)

    for rank, chunk in enumerate(results_b, start=1):
        rrf = 1.0 / (k + rank)
        if chunk.id in scores:
            existing_rrf, existing_chunk = scores[chunk.id]
            combined = existing_rrf + rrf
            existing_chunk.score = combined
            scores[chunk.id] = (combined, existing_chunk)
        else:
            chunk.score = rrf
            scores[chunk.id] = (rrf, chunk)

    fused = sorted(scores.values(), key=lambda x: x[0], reverse=True)
    return [item[1] for item in fused]


def _merge_fts_results(
    result_sets: list[list[ScoredChunk]],
    k: int = 60,
) -> list[ScoredChunk]:
    seen: dict[int, tuple[float, ScoredChunk]] = {}

    for result_set in result_sets:
        for rank, chunk in enumerate(result_set, start=1):
            rrf = 1.0 / (k + rank)
            if chunk.id in seen:
                if rrf > seen[chunk.id][0]:
                    chunk.score = rrf
                    seen[chunk.id] = (rrf, chunk)
            else:
                chunk.score = rrf
                seen[chunk.id] = (rrf, chunk)

    merged = sorted(seen.values(), key=lambda x: x[0], reverse=True)
    return [item[1] for item in merged]


async def hybrid_search(
    conn: asyncpg.Connection,
    query: str,
    *,
    top_k: int,
    strategy: str,
    contextual: bool,
    k: int = 60,
    fts_queries: list[str] | None = None,
) -> list[ScoredChunk]:
    from backend.db import _pool

    fetch_k = max(top_k, 20) * 3

    if fts_queries is None:
        fts_queries = [query]

    if _pool is not None:
        fts_result_sets: list[list[ScoredChunk]] = []

        async def _fts(q: str) -> list[ScoredChunk]:
            async with _pool.acquire() as c:
                return await fts_search(c, q, top_k=fetch_k, strategy=strategy)

        async with _pool.acquire() as c:
            vec_results = await vector_search(c, query, top_k=fetch_k, strategy=strategy, contextual=contextual)
            fts_tasks = [_fts(q) for q in fts_queries]
            fts_result_sets = list(await asyncio.gather(*fts_tasks))
    else:
        vec_results = await vector_search(conn, query, top_k=fetch_k, strategy=strategy, contextual=contextual)
        fts_result_sets = []
        for q in fts_queries:
            fts_result_sets.append(await fts_search(conn, q, top_k=fetch_k, strategy=strategy))

    merged_fts = _merge_fts_results(fts_result_sets, k)

    fused = _rrf_fuse(vec_results, merged_fts, k)

    return fused[:top_k]
