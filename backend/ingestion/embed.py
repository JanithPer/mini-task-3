import asyncio
import contextlib
from concurrent.futures import ThreadPoolExecutor

from sentence_transformers import SentenceTransformer

from backend.config import settings

_model: SentenceTransformer | None = None
_load_lock = asyncio.Lock()
_load_executor = ThreadPoolExecutor(max_workers=1)


async def ensure_model_loaded() -> None:
    global _model

    if _model is not None:
        return

    async with _load_lock:
        if _model is not None:
            return

        _model = await asyncio.get_event_loop().run_in_executor(
            _load_executor,
            lambda: SentenceTransformer(settings.EMBEDDING_MODEL),
        )
        with contextlib.suppress(Exception):
            _model.to("cuda")


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    if _model is None:
        raise RuntimeError("Embedding model not loaded — call ensure_model_loaded() first")

    embeddings = _model.encode(
        texts,
        batch_size=64,
        show_progress_bar=False,
        normalize_embeddings=False,
    )
    return embeddings.tolist()
