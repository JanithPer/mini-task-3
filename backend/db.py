import asyncpg

from backend.config import settings

_pool: asyncpg.Pool | None = None


async def init_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            dsn=settings.DATABASE_URL,
            min_size=1,
            max_size=10,
        )
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("Pool not initialized; call init_pool() first")
    return _pool


async def fetch_one(sql: str, *args: object) -> asyncpg.Record | None:
    pool = get_pool()
    async with pool.acquire() as conn:
        return await conn.fetchrow(sql, *args)


async def fetch_all(sql: str, *args: object) -> list[asyncpg.Record]:
    pool = get_pool()
    async with pool.acquire() as conn:
        return await conn.fetch(sql, *args)


async def execute(sql: str, *args: object) -> str:
    pool = get_pool()
    async with pool.acquire() as conn:
        return await conn.execute(sql, *args)
