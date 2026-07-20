import asyncio
from backend.db import init_pool, get_pool

async def main():
    await init_pool()
    pool = get_pool()
    async with pool.acquire() as c:
        rows = await c.fetch("""
            SELECT run_at, strategy,
                   results->>'avg_cost' AS avg_cost,
                   cost_breakdown->>'total' AS total_cost
            FROM benchmark_runs
            ORDER BY run_at DESC
            LIMIT 15
        """)
        for r in rows:
            print(f'{r["run_at"]}  {r["strategy"]:25}  avg_cost={r["avg_cost"]}  total_cost={r["total_cost"]}')

        count = await c.fetchval("SELECT COUNT(*) FROM benchmark_runs")
        print(f"\nTotal rows: {count}")

        ctx = await c.fetchrow("SELECT COUNT(*) AS n, COALESCE(SUM(cost_usd),0) AS total FROM cost_events WHERE component='query_rewrite'")
        print(f"\nquery_rewrite cost events: {ctx['n']} rows, total ${ctx['total']:.6f}")

asyncio.run(main())
