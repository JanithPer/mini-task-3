import asyncpg

from backend.ingestion.embed import embed_texts
from backend.retrieval import ScoredChunk


def _format_vector(embedding: list[float]) -> str:
    return "[" + ",".join(str(v) for v in embedding) + "]"


async def vector_search(
    conn: asyncpg.Connection,
    query: str,
    *,
    top_k: int,
    strategy: str,
    contextual: bool,
) -> list[ScoredChunk]:
    embedding = embed_texts([query])[0]
    emb_str = _format_vector(embedding)

    rows = await conn.fetch(
        """
        SELECT c.id, c.document_id, c.strategy, c.content, c.contextualized_content,
               c.embedding <=> $1::vector AS distance,
               d.title, d.arxiv_id
        FROM chunks c JOIN documents d ON d.id = c.document_id
        WHERE c.strategy = $2
        ORDER BY distance ASC
        LIMIT $3
        """,
        emb_str,
        strategy,
        top_k,
    )

    return [
        ScoredChunk(
            id=row["id"],
            document_id=row["document_id"],
            strategy=row["strategy"],
            content=row["content"],
            contextualized_content=row["contextualized_content"],
            score=1.0 - float(row["distance"]),
            document_title=row["title"],
            arxiv_id=row["arxiv_id"],
        )
        for row in rows
    ]
