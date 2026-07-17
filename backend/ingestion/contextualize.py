import asyncio

import tiktoken
from openai import (
    APITimeoutError,
    AsyncOpenAI,
    InternalServerError,
    RateLimitError,
)
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from backend.config import settings
from backend.ingestion import Chunk, ParsedDoc

_client: AsyncOpenAI | None = None
_encoding: tiktoken.Encoding | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


def _get_encoding() -> tiktoken.Encoding:
    global _encoding
    if _encoding is None:
        _encoding = tiktoken.get_encoding("cl100k_base")
    return _encoding


SYSTEM_PROMPT = "You are a context-generation assistant."

USER_TEMPLATE = (
    "Given the full document below, write a 1-2 sentence context that situates "
    "this chunk within the document. Return only the context, no preamble.\n\n"
    "Document summary: {summary}\n\n"
    "Full document (truncated): {doc_text}\n\n"
    "Chunk: {chunk_text}"
)


@retry(
    retry=retry_if_exception_type((RateLimitError, APITimeoutError, InternalServerError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=30),
)
async def _generate_context(
    summary: str,
    doc_text: str,
    chunk_text: str,
    sem: asyncio.Semaphore,
) -> str:
    async with sem:
        client = _get_client()
        response = await client.chat.completions.create(
            model=settings.CONTEXT_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": USER_TEMPLATE.format(
                        summary=summary,
                        doc_text=doc_text[:6000],
                        chunk_text=chunk_text,
                    ),
                },
            ],
            max_tokens=200,
            temperature=0.0,
        )
        return response.choices[0].message.content or ""


async def contextualize_chunks(
    doc: ParsedDoc,
    chunks: list[Chunk],
    *,
    max_concurrent: int = 8,
) -> list[str]:
    if not settings.OPENAI_API_KEY:
        return [""] * len(chunks)

    sem = asyncio.Semaphore(max_concurrent)

    async def _safe_generate(chunk_text: str) -> str:
        try:
            return await _generate_context(doc.summary, doc.markdown, chunk_text, sem)
        except Exception as e:
            print(f"Context gen error for {doc.arxiv_id}: {e}")
            return ""

    tasks = [_safe_generate(chunk.content) for chunk in chunks]
    return list(await asyncio.gather(*tasks))


def count_context_tokens(
    doc_summary: str,
    doc_text: str,
    chunks: list[Chunk],
    contexts: list[str],
) -> dict:
    enc = _get_encoding()
    tokens_in = 0
    tokens_out = 0

    for chunk, ctx in zip(chunks, contexts, strict=True):
        prompt = USER_TEMPLATE.format(
            summary=doc_summary,
            doc_text=doc_text[:6000],
            chunk_text=chunk.content,
        )
        tokens_in += len(enc.encode(SYSTEM_PROMPT + prompt))
        tokens_out += len(enc.encode(ctx)) if ctx else 0

    return {"tokens_in": tokens_in, "tokens_out": tokens_out}
