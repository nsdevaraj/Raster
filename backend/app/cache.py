import redis.asyncio as redis
from typing import Optional
import xxhash
import json
import logging
from .config import settings

logger = logging.getLogger(__name__)


class CacheManager:
    def __init__(self):
        self.enabled = settings.cache_enabled
        self.ttl = settings.cache_ttl
        self.redis_client: Optional[redis.Redis] = None
        
    async def connect(self):
        if not self.enabled:
            logger.info("Cache is disabled")
            return
            
        try:
            self.redis_client = redis.Redis(
                host=settings.redis_host,
                port=settings.redis_port,
                db=settings.redis_db,
                password=settings.redis_password,
                decode_responses=False
            )
            await self.redis_client.ping()
            logger.info("Successfully connected to Redis cache")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.enabled = False
    
    async def disconnect(self):
        if self.redis_client:
            await self.redis_client.close()
    
    def generate_cache_key(self, image_data: bytes, params: dict) -> str:
        """Generate a cache key based on image content and processing parameters"""
        hasher = xxhash.xxh64()
        hasher.update(image_data)
        hasher.update(json.dumps(params, sort_keys=True).encode())
        return f"svg:{hasher.hexdigest()}"
    
    async def get(self, key: str) -> Optional[bytes]:
        """Retrieve cached SVG data"""
        if not self.enabled or not self.redis_client:
            return None
            
        try:
            data = await self.redis_client.get(key)
            if data:
                logger.info(f"Cache hit for key: {key}")
            return data
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None
    
    async def set(self, key: str, value: bytes, ttl: Optional[int] = None):
        """Store SVG data in cache"""
        if not self.enabled or not self.redis_client:
            return
            
        try:
            ttl = ttl or self.ttl
            await self.redis_client.setex(key, ttl, value)
            logger.info(f"Cached result for key: {key}")
        except Exception as e:
            logger.error(f"Cache set error: {e}")
    
    async def exists(self, key: str) -> bool:
        """Check if a key exists in cache"""
        if not self.enabled or not self.redis_client:
            return False
            
        try:
            return bool(await self.redis_client.exists(key))
        except Exception as e:
            logger.error(f"Cache exists check error: {e}")
            return False
    
    async def get_stats(self) -> dict:
        """Get cache statistics"""
        if not self.enabled or not self.redis_client:
            return {"enabled": False}
            
        try:
            info = await self.redis_client.info("stats")
            return {
                "enabled": True,
                "hits": info.get("keyspace_hits", 0),
                "misses": info.get("keyspace_misses", 0),
                "total_keys": await self.redis_client.dbsize()
            }
        except Exception as e:
            logger.error(f"Failed to get cache stats: {e}")
            return {"enabled": True, "error": str(e)}


cache_manager = CacheManager()
