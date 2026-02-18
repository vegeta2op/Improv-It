import json
from typing import Optional, Any
import redis.asyncio as redis
from app.config import settings

redis_client: Optional[redis.Redis] = None


async def get_redis() -> redis.Redis:
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(
            settings.REDIS_URL, encoding="utf-8", decode_responses=True
        )
    return redis_client


async def close_redis():
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None


# Cache helpers
async def cache_get(key: str) -> Optional[Any]:
    """Get value from cache"""
    try:
        client = await get_redis()
        value = await client.get(key)
        if value:
            return json.loads(value)
        return None
    except Exception:
        return None


async def cache_set(key: str, value: Any, expire: int = 300) -> bool:
    """Set value in cache with expiration (default 5 minutes)"""
    try:
        client = await get_redis()
        await client.set(key, json.dumps(value), ex=expire)
        return True
    except Exception:
        return False


async def cache_delete(key: str) -> bool:
    """Delete key from cache"""
    try:
        client = await get_redis()
        await client.delete(key)
        return True
    except Exception:
        return False


async def cache_delete_pattern(pattern: str) -> int:
    """Delete all keys matching pattern"""
    try:
        client = await get_redis()
        keys = []
        async for key in client.scan_iter(match=pattern):
            keys.append(key)
        if keys:
            return await client.delete(*keys)
        return 0
    except Exception:
        return 0


# Cache keys
class CacheKeys:
    ANALYTICS = "analytics:overview"
    ANALYTICS_STUDENT = "analytics:student:{usn}"
    STUDENT = "student:{usn}"
    STUDENTS_LIST = "students:list"
    PREDICTION = "prediction:{usn}"
    TOP_PERFORMERS = "analytics:top_performers"


def make_cache_key(prefix: str, **kwargs) -> str:
    """Create cache key with parameters"""
    parts = [prefix]
    for key, value in sorted(kwargs.items()):
        parts.append(f"{key}:{value}")
    return ":".join(parts)
