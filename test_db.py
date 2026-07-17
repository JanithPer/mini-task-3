import asyncio
from backend.db import init_pool, close_pool


async def test():
    p = await init_pool()
    print("pool ok")
    async with p.acquire() as c:
        v = await c.fetchval("SELECT 1")
        print(f"DB: {v}")
    await close_pool()
    print("done")


asyncio.run(test())
