import asyncio
from backend.db import init_pool, close_pool
from backend.ingestion.chunk_recursive import chunk_recursive
from backend.ingestion.chunk_semantic import chunk_semantic
from backend.ingestion.contextualize import contextualize_chunks
from backend.ingestion.embed import embed_texts
from backend.ingestion.store import (
    create_hnsw_index,
    create_ingestion_task,
    record_cost,
    update_ingestion_task,
    upsert_chunks,
    upsert_document,
)
from backend.ingestion import Paper, ParsedDoc


async def test():
    pool = await init_pool()

    doc = ParsedDoc(
        arxiv_id="test-001",
        title="Test Document",
        markdown="This is a test document about machine learning.\n\n"
        "Machine learning is a subset of artificial intelligence. "
        "It enables systems to learn from data.\n\n"
        "Deep learning uses neural networks with many layers.\n\n"
        "Transformers are a type of neural network architecture." * 10,
        summary="This is a test document about machine learning.",
    )

    print(f"Markdown: {len(doc.markdown)} chars")

    rec = chunk_recursive(doc.markdown)
    sem = chunk_semantic(doc.markdown)
    print(f"Chunks: rec={len(rec)}, sem={len(sem)}")

    print("Contextualizing...")
    rec_ctxs = await contextualize_chunks(doc, rec)
    sem_ctxs = await contextualize_chunks(doc, sem)

    rec_texts = [
        f"{ctx}\n\n{chunk.content}" if ctx else chunk.content
        for ctx, chunk in zip(rec_ctxs, rec)
    ]
    sem_texts = [
        f"{ctx}\n\n{chunk.content}" if ctx else chunk.content
        for ctx, chunk in zip(sem_ctxs, sem)
    ]

    print(f"Embedding {len(rec_texts) + len(sem_texts)} texts...")
    rec_embs = embed_texts(rec_texts)
    sem_embs = embed_texts(sem_texts)
    print(f"Embeddings: rec={len(rec_embs)}x{len(rec_embs[0]) if rec_embs else 0}")

    async with pool.acquire() as conn:
        task_id = await create_ingestion_task(conn)
        await update_ingestion_task(conn, task_id, total=1, message="testing")

        doc_id = await upsert_document(
            conn,
            Paper(
                arxiv_id=doc.arxiv_id,
                title=doc.title,
                abstract=doc.summary,
                file_path=f"data/pdfs/{doc.arxiv_id}.pdf",
            ),
        )
        print(f"Document ID: {doc_id}")

        await upsert_chunks(
            conn, doc_id, rec,
            strategy="recursive",
            contextualized=rec_texts,
            embeddings=rec_embs,
        )
        await upsert_chunks(
            conn, doc_id, sem,
            strategy="semantic",
            contextualized=sem_texts,
            embeddings=sem_embs,
        )
        print("Chunks stored")

        rec_count = await conn.fetchval(
            "SELECT COUNT(*) FROM chunks WHERE document_id = $1 AND strategy = 'recursive'",
            doc_id,
        )
        sem_count = await conn.fetchval(
            "SELECT COUNT(*) FROM chunks WHERE document_id = $1 AND strategy = 'semantic'",
            doc_id,
        )
        print(f"DB chunks: rec={rec_count}, sem={sem_count}")

        await create_hnsw_index(conn)
        await record_cost(conn, "embedding", units=len(rec) + len(sem), cost_usd=0.0)
        await update_ingestion_task(conn, task_id, status="complete", message="test done")

        idx = await conn.fetchrow(
            "SELECT indexname FROM pg_indexes WHERE indexname = 'chunks_embedding_hnsw'"
        )
        print(f"HNSW index: {idx['indexname'] if idx else 'NOT FOUND'}")

        task = await conn.fetchrow(
            "SELECT status FROM ingestion_tasks WHERE id = $1", task_id
        )
        print(f"Task status: {task['status']}")

    await close_pool()
    print("ALL PASSED")


asyncio.run(test())
