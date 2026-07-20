import asyncio
import logging
from collections.abc import Callable

import asyncpg

from backend.db import init_pool
from backend.ingestion import IngestionSummary, Paper
from backend.ingestion.chunk_recursive import chunk_recursive
from backend.ingestion.chunk_semantic import chunk_semantic
from backend.ingestion.contextualize import contextualize_chunks, count_context_tokens
from backend.ingestion.download import fetch_papers
from backend.ingestion.embed import embed_texts
from backend.ingestion.parse import parse_pdf
from backend.ingestion.store import (
    create_hnsw_index,
    create_ingestion_task,
    record_cost,
    update_ingestion_task,
    upsert_chunks,
    upsert_document,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


G4OM_INPUT_COST_PER_1M = 0.15
G4OM_OUTPUT_COST_PER_1M = 0.60


async def run_ingestion(
    progress_cb: Callable[[int, int], object] | None = None,
    *,
    pool: asyncpg.Pool | None = None,
    task_id: str | None = None,
) -> IngestionSummary:
    summary = IngestionSummary()
    _pool = pool or await init_pool()

    if task_id is None:
        async with _pool.acquire() as conn:
            task_id = await create_ingestion_task(conn)

    try:
        logger.info("Step 1: Downloading papers...")
        papers = await fetch_papers(target_count=130)
        summary.papers_downloaded = len(papers)
        logger.info(f"Total papers available: {len(papers)}")

        async with _pool.acquire() as conn:
            await update_ingestion_task(conn, task_id, total=len(papers), message="Parsing PDFs...")

        logger.info("Step 2: Parsing PDFs...")
        parsed_docs = []
        for paper in papers:
            try:
                doc = await parse_pdf(paper.file_path)
                parsed_docs.append(doc)
            except Exception as e:
                msg = f"Parse error for {paper.arxiv_id}: {e}"
                logger.error(msg)
                summary.errors.append(msg)
        summary.papers_parsed = len(parsed_docs)
        logger.info(f"Parsed {len(parsed_docs)} documents")

        total_context_tokens_in = 0
        total_context_tokens_out = 0
        total_embed_units = 0

        logger.info("Step 3-6: Chunking, contextualizing, embedding, storing...")
        for i, doc in enumerate(parsed_docs):
            try:
                rec_chunks = chunk_recursive(doc.markdown)
                sem_chunks = chunk_semantic(doc.markdown)

                rec_contexts = await contextualize_chunks(doc, rec_chunks)
                sem_contexts = await contextualize_chunks(doc, sem_chunks)

                rec_context_counts = count_context_tokens(
                    doc.summary, doc.markdown, rec_chunks, rec_contexts
                )
                sem_context_counts = count_context_tokens(
                    doc.summary, doc.markdown, sem_chunks, sem_contexts
                )
                total_context_tokens_in += (
                    rec_context_counts["tokens_in"] + sem_context_counts["tokens_in"]
                )
                total_context_tokens_out += (
                    rec_context_counts["tokens_out"] + sem_context_counts["tokens_out"]
                )

                rec_embed_texts = [
                    f"{ctx}\n\n{chunk.content}" if ctx else chunk.content
                    for ctx, chunk in zip(rec_contexts, rec_chunks, strict=True)
                ]
                sem_embed_texts = [
                    f"{ctx}\n\n{chunk.content}" if ctx else chunk.content
                    for ctx, chunk in zip(sem_contexts, sem_chunks, strict=True)
                ]

                rec_embeddings = embed_texts(rec_embed_texts)
                sem_embeddings = embed_texts(sem_embed_texts)
                total_embed_units += len(rec_embed_texts) + len(sem_embed_texts)

                async with _pool.acquire() as conn:
                    doc_id = await upsert_document(
                        conn,
                        Paper(
                            arxiv_id=doc.arxiv_id,
                            title=doc.title,
                            abstract=doc.summary,
                            file_path=f"data/pdfs/{doc.arxiv_id}.pdf",
                        ),
                    )

                    await upsert_chunks(
                        conn,
                        doc_id,
                        rec_chunks,
                        strategy="recursive",
                        contextualized=rec_embed_texts,
                        embeddings=rec_embeddings,
                    )
                    await upsert_chunks(
                        conn,
                        doc_id,
                        sem_chunks,
                        strategy="semantic",
                        contextualized=sem_embed_texts,
                        embeddings=sem_embeddings,
                    )

                summary.chunks_created += len(rec_chunks) + len(sem_chunks)
                summary.chunks_embedded += len(rec_chunks) + len(sem_chunks)

                if progress_cb:
                    progress_cb(i + 1, len(parsed_docs))

                async with _pool.acquire() as conn:
                    await update_ingestion_task(
                        conn,
                        task_id,
                        progress=i + 1,
                        message=f"Processing {doc.arxiv_id}",
                    )

            except Exception as e:
                msg = f"Processing error for {doc.arxiv_id}: {e}"
                logger.error(msg)
                summary.errors.append(msg)

            if (i + 1) % 10 == 0:
                logger.info(f"Progress: {i + 1}/{len(parsed_docs)} documents")

        logger.info("Step 7: Creating HNSW index...")
        async with _pool.acquire() as conn:
            await create_hnsw_index(conn)

        logger.info("Recording cost events...")
        async with _pool.acquire() as conn:
            context_cost = (
                total_context_tokens_in / 1_000_000 * G4OM_INPUT_COST_PER_1M
                + total_context_tokens_out / 1_000_000 * G4OM_OUTPUT_COST_PER_1M
            )
            if total_context_tokens_in or total_context_tokens_out:
                await record_cost(
                    conn,
                    "context_gen",
                    tokens_in=total_context_tokens_in,
                    tokens_out=total_context_tokens_out,
                    cost_usd=round(context_cost, 6),
                )

            if total_embed_units:
                await record_cost(
                    conn,
                    "embedding",
                    units=total_embed_units,
                    cost_usd=0.0,
                )

            await update_ingestion_task(
                conn, task_id, status="complete", message="Ingestion complete"
            )

        logger.info(
            f"Ingestion complete: {summary.papers_downloaded} papers, "
            f"{summary.chunks_created} chunks, {len(summary.errors)} errors"
        )

    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        try:
            async with _pool.acquire() as conn:
                await update_ingestion_task(conn, task_id, status="error", message=str(e))
        except Exception:
            pass
        raise

    finally:
        if pool is None:
            from backend.db import close_pool

            await close_pool()

    return summary


if __name__ == "__main__":
    asyncio.run(run_ingestion())
