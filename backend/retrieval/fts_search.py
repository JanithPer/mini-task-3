import asyncpg

from backend.retrieval import ScoredChunk


async def fts_search(
    conn: asyncpg.Connection,
    query: str,
    *,
    top_k: int,
    strategy: str,
) -> list[ScoredChunk]:
    rows = await conn.fetch(
        """
        SELECT c.id, c.document_id, c.strategy, c.content, c.contextualized_content,
               ts_rank_cd(c.content_tsv, websearch_to_tsquery('english', $1)) AS rank,
               d.title, d.arxiv_id
        FROM chunks c JOIN documents d ON d.id = c.document_id
        WHERE c.strategy = $2 AND c.content_tsv @@ websearch_to_tsquery('english', $1)
        ORDER BY rank DESC
        LIMIT $3
        """,
        query,
        strategy,
        top_k,
    )

    results = [
        ScoredChunk(
            id=row["id"],
            document_id=row["document_id"],
            strategy=row["strategy"],
            content=row["content"],
            contextualized_content=row["contextualized_content"],
            score=float(row["rank"]),
            document_title=row["title"],
            arxiv_id=row["arxiv_id"],
        )
        for row in rows
    ]

    if results:
        scores = [r.score for r in results]
        min_score = min(scores)
        max_score = max(scores)
        if max_score > min_score:
            for r in results:
                r.score = (r.score - min_score) / (max_score - min_score)
        else:
            for r in results:
                r.score = 1.0

    return results
