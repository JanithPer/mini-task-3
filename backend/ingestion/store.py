import asyncpg

from backend.ingestion import Chunk, Paper


def _format_vector(embedding: list[float]) -> str:
    return "[" + ",".join(str(v) for v in embedding) + "]"


async def upsert_document(conn: asyncpg.Connection, paper: Paper) -> int:
    row = await conn.fetchrow(
        """
        INSERT INTO documents (arxiv_id, title, abstract, file_path)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (arxiv_id) DO UPDATE SET
            title = EXCLUDED.title,
            abstract = EXCLUDED.abstract,
            file_path = EXCLUDED.file_path
        RETURNING id
        """,
        paper.arxiv_id,
        paper.title,
        paper.abstract,
        paper.file_path,
    )
    return row["id"]


async def upsert_chunks(
    conn: asyncpg.Connection,
    document_id: int,
    chunks: list[Chunk],
    *,
    strategy: str,
    contextualized: list[str],
    embeddings: list[list[float]],
) -> None:
    await conn.execute(
        "DELETE FROM chunks WHERE document_id = $1 AND strategy = $2",
        document_id,
        strategy,
    )

    for i in range(len(chunks)):
        emb = embeddings[i] if i < len(embeddings) else None
        emb_str = _format_vector(emb) if emb else None
        ctx = contextualized[i] if contextualized[i] else None

        await conn.execute(
            """
            INSERT INTO chunks (document_id, strategy, content, contextualized_content, embedding, metadata, token_count)
            VALUES ($1, $2, $3, $4, $5::vector, $6, $7)
            """,
            document_id,
            strategy,
            chunks[i].content,
            ctx,
            emb_str,
            "{}",
            chunks[i].token_count,
        )


async def create_hnsw_index(conn: asyncpg.Connection) -> None:
    await conn.execute(
        """
        CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw
        ON chunks USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 200)
        """
    )


async def record_cost(
    conn: asyncpg.Connection,
    component: str,
    *,
    tokens_in: int = 0,
    tokens_out: int = 0,
    units: int = 0,
    cost_usd: float = 0.0,
) -> None:
    await conn.execute(
        """
        INSERT INTO cost_events (component, tokens_in, tokens_out, units, cost_usd)
        VALUES ($1, $2, $3, $4, $5)
        """,
        component,
        tokens_in,
        tokens_out,
        units,
        cost_usd,
    )


async def get_last_ingested(conn: asyncpg.Connection) -> str | None:
    row = await conn.fetchrow(
        "SELECT finished_at FROM ingestion_tasks WHERE status = 'complete' ORDER BY finished_at DESC LIMIT 1"
    )
    if row:
        return row["finished_at"].isoformat()
    return None


async def create_ingestion_task(conn: asyncpg.Connection) -> str:
    row = await conn.fetchrow(
        """
        INSERT INTO ingestion_tasks (status, progress, total, message)
        VALUES ('running', 0, 0, 'Ingestion started')
        RETURNING id
        """
    )
    return str(row["id"])


async def update_ingestion_task(
    conn: asyncpg.Connection,
    task_id: str,
    *,
    status: str | None = None,
    progress: int | None = None,
    total: int | None = None,
    message: str | None = None,
) -> None:
    fields: list[str] = []
    values: list[object] = []

    if status is not None:
        fields.append(f"status = ${len(values) + 1}")
        values.append(status)
        if status in ("complete", "error"):
            fields.append("finished_at = now()")

    if progress is not None:
        fields.append(f"progress = ${len(values) + 1}")
        values.append(progress)

    if total is not None:
        fields.append(f"total = ${len(values) + 1}")
        values.append(total)

    if message is not None:
        fields.append(f"message = ${len(values) + 1}")
        values.append(message)

    if not fields:
        return

    values.append(task_id)
    query = f"UPDATE ingestion_tasks SET {', '.join(fields)} WHERE id = ${len(values)}"
    await conn.execute(query, *values)
