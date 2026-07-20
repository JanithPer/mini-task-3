import argparse
import asyncio
import json
from pathlib import Path

from backend.db import close_pool, init_pool
from backend.retrieval.vector_search import vector_search

QUERIES_PATH = Path(__file__).parent / "queries.json"


async def _author(default_gold: int = 3, boosted_gold: int = 4, boosted_count: int = 5) -> None:
    with open(QUERIES_PATH, encoding="utf-8") as f:
        queries = json.load(f)

    if len(queries) < boosted_count:
        raise SystemExit(
            f"Need at least {boosted_count} queries to satisfy the ≥4-gold requirement, "
            f"found {len(queries)}."
        )

    pool = await init_pool()
    try:
        boost_indices = set(range(boosted_count))
        updated: list[dict[str, object]] = []
        for i, q in enumerate(queries):
            gold_n = boosted_gold if i in boost_indices else default_gold
            top_k = max(gold_n, 10)
            async with pool.acquire() as conn:
                results = await vector_search(
                    conn,
                    q["query"],
                    top_k=top_k,
                    strategy="recursive",
                    contextual=False,
                )
            chunk_ids = [str(r.id) for r in results[:gold_n]]
            q["golden_chunks"] = chunk_ids
            updated.append(q)
            print(f"[{q['id']}] {len(chunk_ids)} golden chunks selected")
    finally:
        await close_pool()

    with open(QUERIES_PATH, "w", encoding="utf-8") as f:
        json.dump(updated, f, indent=2)

    print(f"\nWrote {len(updated)} queries to {QUERIES_PATH}")
    print(
        "Review the assigned goldens and trim/replace any chunk IDs that are not clearly "
        "relevant to the question (see docs/phases/phase-4-benchmarking.md §4.1 step 2)."
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Populate golden_chunks in backend/benchmark/queries.json "
        "from top-k vector search hits (post Phase 2 ingestion). "
        "Manual review of the chosen chunk IDs is required afterwards."
    )
    parser.add_argument(
        "--default-gold",
        type=int,
        default=3,
        help="Number of golden chunk IDs per query (default: 3).",
    )
    parser.add_argument(
        "--boosted-gold",
        type=int,
        default=4,
        help="Gold count for the first N boosted queries (default: 4). "
        "At least 5 queries must have ≥4 goldens per spec.",
    )
    parser.add_argument(
        "--boosted-count",
        type=int,
        default=5,
        help="Number of queries that get the boosted gold count (default: 5).",
    )
    args = parser.parse_args()

    asyncio.run(
        _author(
            default_gold=args.default_gold,
            boosted_gold=args.boosted_gold,
            boosted_count=args.boosted_count,
        )
    )


if __name__ == "__main__":
    main()
