import asyncio
import logging
from typing import Union

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from backend.db import get_pool
from backend.models import SearchRequest, SearchResponse, SearchResultItem
from backend.retrieval.search import SearchParams, search as _do_search

router = APIRouter(tags=["search"])
logger = logging.getLogger(__name__)


async def _wait_for_disconnect(request: Request, cancel_event: asyncio.Event) -> None:
    while True:
        if await request.is_disconnected():
            cancel_event.set()
            return
        await asyncio.sleep(0.1)


@router.post("/search", response_model=SearchResponse)
async def do_search(
    payload: SearchRequest, request: Request
) -> Union[SearchResponse, JSONResponse]:
    pool = get_pool()
    cancel_event = asyncio.Event()

    params = SearchParams(
        query=payload.query,
        chunk_strategy=payload.chunk_strategy,
        hybrid=payload.hybrid,
        rerank=payload.rerank,
        contextual=payload.contextual,
        top_k=payload.top_k,
    )

    async def run() -> SearchResponse:
        async with pool.acquire() as conn:
            result = await _do_search(conn, params, cancel_event=cancel_event)
            return SearchResponse(
                results=[
                    SearchResultItem(
                        rank=r.rank,
                        chunk_id=r.chunk_id,
                        content=r.content,
                        contextualized_content=r.contextualized_content,
                        score=r.score,
                        document_title=r.document_title,
                        arxiv_id=r.arxiv_id,
                        chunk_strategy=r.chunk_strategy,  # type: ignore[arg-type]
                    )
                    for r in result.results
                ],
                elapsed_ms=result.elapsed_ms,
                query=result.query,
                params_applied=payload,
            )

    search_task = asyncio.ensure_future(run())
    disconnect_task = asyncio.ensure_future(_wait_for_disconnect(request, cancel_event))

    try:
        done, pending = await asyncio.wait(
            [search_task, disconnect_task],
            return_when=asyncio.FIRST_COMPLETED,
            timeout=30.0,
        )

        if search_task in done:
            disconnect_task.cancel()
            if search_task.cancelled():
                return JSONResponse(
                    status_code=499,
                    content={"error": {"code": "client_disconnect", "message": "Client disconnected."}},
                )
            return search_task.result()

        if disconnect_task in done:
            search_task.cancel()
            return JSONResponse(
                status_code=499,
                content={"error": {"code": "client_disconnect", "message": "Client disconnected."}},
            )

        search_task.cancel()
        disconnect_task.cancel()
        logger.warning("Search timed out after 30s for query: %s", payload.query[:100])
        return JSONResponse(
            status_code=504,
            content={"error": {"code": "search_timeout", "message": "Search exceeded 30s."}},
        )
    except Exception:
        search_task.cancel()
        disconnect_task.cancel()
        raise
