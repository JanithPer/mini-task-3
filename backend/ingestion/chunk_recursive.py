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
    if not text.strip():
        return []
    encoding = tiktoken.get_encoding(model)

    segments = _recursive_split(text, SEPARATORS, encoding, target_tokens)

    chunks: list[Chunk] = []
    current = ""
    current_tokens = 0

    for segment in segments:
        if not segment:
            continue
        seg_tokens = len(encoding.encode(segment))

        if current and current_tokens + seg_tokens > target_tokens:
            chunks.append(Chunk(content=current, token_count=current_tokens))
            overlap = _tail_by_tokens(current, overlap_tokens, encoding)
            current = overlap + segment
            current_tokens = len(encoding.encode(current))
        else:
            current += segment
            current_tokens += seg_tokens

    if current.strip():
        chunks.append(Chunk(content=current, token_count=current_tokens))

    return chunks


def _recursive_split(
    text: str,
    separators: list[str],
    encoding: tiktoken.Encoding,
    target_tokens: int,
) -> list[str]:
    if len(encoding.encode(text)) <= target_tokens:
        return [text]

    chosen_sep = separators[-1]
    deeper: list[str] = []
    for i, sep in enumerate(separators):
        if sep == "":
            chosen_sep = ""
            deeper = []
            break
        if sep in text:
            chosen_sep = sep
            deeper = separators[i + 1 :]
            break

    if chosen_sep == "":
        return _token_split(text, encoding, target_tokens)

    parts = text.split(chosen_sep)
    out: list[str] = []

    for i, part in enumerate(parts):
        if not part:
            continue
        sep_suffix = chosen_sep if i < len(parts) - 1 else ""
        part_text = part + sep_suffix
        part_toks = len(encoding.encode(part_text))

        if part_toks > target_tokens and deeper:
            out.extend(_recursive_split(part_text, deeper, encoding, target_tokens))
        else:
            out.append(part_text)

    return out


def _token_split(
    text: str,
    encoding: tiktoken.Encoding,
    target_tokens: int,
) -> list[str]:
    ids = encoding.encode(text)
    out: list[str] = []
    start = 0
    while start < len(ids):
        end = min(start + target_tokens, len(ids))
        out.append(encoding.decode(ids[start:end]))
        start = end
    return out


def _tail_by_tokens(text: str, n_tokens: int, encoding: tiktoken.Encoding) -> str:
    ids = encoding.encode(text)
    if len(ids) <= n_tokens:
        return text
    return encoding.decode(ids[-n_tokens:])
