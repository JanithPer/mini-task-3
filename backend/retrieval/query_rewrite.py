import json
import logging
import re

import tiktoken
from openai import AsyncOpenAI

from backend.config import settings
from backend.ingestion.store import record_cost

logger = logging.getLogger(__name__)

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


G4OM_INPUT_COST_PER_1M = 0.15
G4OM_OUTPUT_COST_PER_1M = 0.60

_FENCE_RE = re.compile(r"```(?:json)?\s*(.*?)\s*```", re.DOTALL)


def _strip_fences(text: str) -> str:
    match = _FENCE_RE.search(text)
    return match.group(1) if match else text


SYSTEM_PROMPT = "You are a query rewriting assistant. Always respond with valid JSON only."

USER_TEMPLATE = (
    "Rewrite the following search query into {n} diverse search queries "
    "that maximize coverage of relevant document chunks. "
    "Return a JSON array of {n} strings only."
    "\n\nQuery: {query}"
)


async def rewrite_query(
    query: str,
    n: int = 3,
    *,
    conn: object = None,
) -> list[str]:
    if not query.strip():
        return [query]

    if not settings.OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY not set – query rewriting disabled, no costs recorded")
        return [query]

    client = _get_client()
    user_content = USER_TEMPLATE.format(n=n, query=query)

    for attempt in range(2):
        try:
            response = await client.chat.completions.create(
                model=settings.CONTEXT_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_content},
                ],
                temperature=0.3,
            )

            if conn is not None and response.usage is not None:
                tokens_in = response.usage.prompt_tokens
                tokens_out = response.usage.completion_tokens
                cost = (
                    tokens_in / 1_000_000 * G4OM_INPUT_COST_PER_1M
                    + tokens_out / 1_000_000 * G4OM_OUTPUT_COST_PER_1M
                )
                try:
                    await record_cost(
                        conn,
                        "query_rewrite",
                        tokens_in=tokens_in,
                        tokens_out=tokens_out,
                        cost_usd=round(cost, 6),
                    )
                except Exception:
                    logger.exception("Failed to record query_rewrite cost event")

            raw = response.choices[0].message.content or "[]"
            cleaned = _strip_fences(raw)
            try:
                parsed = json.loads(cleaned)
            except json.JSONDecodeError:
                if attempt == 0:
                    continue
                return [query]

            if isinstance(parsed, list):
                result = [str(q) for q in parsed if q]
            elif isinstance(parsed, dict) and "queries" in parsed:
                result = [str(q) for q in parsed["queries"] if q]
            else:
                result = []

            if not result:
                result = [query]
            elif len(result) < n:
                result = [query] + result

            return result

        except Exception:
            logger.warning("Query rewrite attempt %d failed", attempt + 1, exc_info=True)
            if attempt == 1:
                return [query]

    return [query]
