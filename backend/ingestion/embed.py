from sentence_transformers import SentenceTransformer

from backend.config import settings

_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
        try:
            _model.to("cuda")
        except Exception:
            pass
    return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []

    model = _get_model()
    embeddings = model.encode(
        texts,
        batch_size=64,
        show_progress_bar=False,
        normalize_embeddings=False,
    )
    return embeddings.tolist()
