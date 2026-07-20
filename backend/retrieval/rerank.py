import asyncio
import contextlib
from concurrent.futures import ThreadPoolExecutor

from sentence_transformers import CrossEncoder

from backend.config import settings
from backend.ingestion.store import record_cost
from backend.retrieval import ScoredChunk

_model: CrossEncoder | None = None
_load_lock = asyncio.Lock()
_load_executor = ThreadPoolExecutor(max_workers=1)


async def ensure_reranker_loaded() -> None:
    global _model

    if _model is not None:
        return

    async with _load_lock:
        if _model is not None:
            return

        _model = await asyncio.get_event_loop().run_in_executor(
            _load_executor,
            lambda: CrossEncoder(settings.RERANK_MODEL),
        )
        with contextlib.suppress(Exception):
            _model.model.to("cuda")


def _sigmoid(x: float) -> float:
    import math

    return 1.0 / (1.0 + math.exp(-x))


async def rerank(
    query: str,
    chunks: list[ScoredChunk],
    *,
    top_n: int = 10,
    conn: object = None,
) -> list[ScoredChunk]:
    if not chunks:
        return []
    if _model is None:
        raise RuntimeError("Rerank model not loaded — call ensure_reranker_loaded() first")

    pairs = [(query, chunk.contextualized_content or chunk.content) for chunk in chunks]

    raw_scores = await asyncio.to_thread(lambda: _model.predict(pairs, show_progress_bar=False))  # type: ignore[arg-type]

    for chunk, score in zip(chunks, raw_scores, strict=True):
        chunk.score = _sigmoid(float(score))

    chunks.sort(key=lambda c: c.score, reverse=True)
    result = chunks[:top_n]

    if conn is not None:
        await record_cost(
            conn,
            "rerank",
            units=len(chunks),
            cost_usd=0.0,
        )

    return result
