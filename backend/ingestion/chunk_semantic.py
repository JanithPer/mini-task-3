import numpy as np
import spacy
import tiktoken
from sentence_transformers import SentenceTransformer

from backend.config import settings
from backend.ingestion import Chunk

_nlp: spacy.Language | None = None
_model: SentenceTransformer | None = None


def _get_nlp() -> spacy.Language:
    global _nlp
    if _nlp is None:
        _nlp = spacy.load("en_core_web_sm")
    return _nlp


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
    return _model


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-10))


def chunk_semantic(
    text: str,
    *,
    target_low: int = 300,
    target_high: int = 800,
    sim_threshold: float = 0.5,
) -> list[Chunk]:
    nlp = _get_nlp()
    doc = nlp(text)
    sentences = [sent.text.strip() for sent in doc.sents if sent.text.strip()]
    if not sentences:
        return []

    model = _get_model()
    embeddings = model.encode(sentences, batch_size=64, show_progress_bar=False)
    embeddings = np.asarray(embeddings)

    encoding = tiktoken.get_encoding("cl100k_base")
    chunks: list[Chunk] = []
    current_sents: list[str] = []
    current_tokens = 0
    running_sum = np.zeros(settings.EMBEDDING_DIM)
    running_count = 0

    for i, sent in enumerate(sentences):
        sent_tokens = len(encoding.encode(sent))
        current_sents.append(sent)
        current_tokens += sent_tokens

        running_sum += embeddings[i]
        running_count += 1
        centroid = running_sum / running_count

        if current_tokens >= target_high:
            chunks.append(_make_chunk(" ".join(current_sents), encoding))
            current_sents = []
            current_tokens = 0
            running_sum = np.zeros(settings.EMBEDDING_DIM)
            running_count = 0
            continue

        if i > 0 and current_tokens >= target_low:
            sim = _cosine_similarity(embeddings[i], centroid)
            if sim < sim_threshold:
                chunks.append(_make_chunk(" ".join(current_sents[:-1]), encoding))
                current_sents = [sent]
                current_tokens = sent_tokens
                running_sum = embeddings[i].copy()
                running_count = 1

    if current_sents:
        chunks.append(_make_chunk(" ".join(current_sents), encoding))

    return chunks


def _make_chunk(text: str, encoding: tiktoken.Encoding) -> Chunk:
    return Chunk(content=text, token_count=len(encoding.encode(text)))
