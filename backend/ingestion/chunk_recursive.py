import tiktoken

from backend.ingestion import Chunk

SEPARATORS = ["\n\n", "\n", ". ", " ", ""]


def chunk_recursive(
    text: str,
    *,
    model: str = "cl100k_base",
    target_tokens: int = 512,
    overlap_tokens: int = 64,
) -> list[Chunk]:
    encoding = tiktoken.get_encoding(model)
    token_ids = encoding.encode(text)
    total = len(token_ids)

    chunks: list[Chunk] = []
    start = 0

    while start < total:
        end = min(start + target_tokens, total)
        chunk_ids = token_ids[start:end]
        chunk_text = _align_to_separators(text, token_ids, start, chunk_ids, encoding)

        chunks.append(Chunk(content=chunk_text, token_count=len(encoding.encode(chunk_text))))
        start = end - overlap_tokens
        if start <= 0 or start >= total:
            break

    return chunks


def _align_to_separators(
    text: str,
    all_ids: list[int],
    chunk_start: int,
    chunk_ids: list[int],
    encoding: tiktoken.Encoding,
) -> str:
    chunk_text = encoding.decode(chunk_ids)

    for sep in SEPARATORS[:-1]:
        last_sep = chunk_text.rfind(sep) if sep else -1
        if last_sep > len(chunk_text) // 2:
            chunk_text = chunk_text[: last_sep + len(sep)]
            break

    return chunk_text
