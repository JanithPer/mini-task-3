import asyncio

from sentence_transformers import CrossEncoder

from backend.config import settings
from backend.ingestion.store import record_cost
from backend.retrieval import ScoredChunk

_model: CrossEncoder | None = None


def _get_model() -> CrossEncoder:
    global _model
    if _model is None:
        _model = CrossEncoder(settings.RERANK_MODEL)
        import contextlib

        with contextlib.suppress(Exception):
            _model.model.to("cuda")
    return _model


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

    model = _get_model()
    pairs = [
        (query, chunk.contextualized_content or chunk.content)
        for chunk in chunks
    ]

    raw_scores = await asyncio.to_thread(lambda: model.predict(pairs, show_progress_bar=False))  # type: ignore[arg-type]

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
