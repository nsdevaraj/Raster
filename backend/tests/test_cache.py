import pytest
from app.cache import CacheManager


@pytest.mark.asyncio
async def test_cache_manager_initialization():
    """Test cache manager can be initialized"""
    cache = CacheManager()
    assert cache.enabled in [True, False]
    assert cache.ttl > 0


@pytest.mark.asyncio
async def test_generate_cache_key():
    """Test cache key generation"""
    cache = CacheManager()
    
    image_data = b"test image data"
    params = {"resize": True, "enhance": False}
    
    key1 = cache.generate_cache_key(image_data, params)
    key2 = cache.generate_cache_key(image_data, params)
    
    assert key1 == key2
    assert key1.startswith("svg:")
    

@pytest.mark.asyncio
async def test_different_params_different_keys():
    """Test different parameters generate different keys"""
    cache = CacheManager()
    
    image_data = b"test image data"
    params1 = {"resize": True, "enhance": False}
    params2 = {"resize": True, "enhance": True}
    
    key1 = cache.generate_cache_key(image_data, params1)
    key2 = cache.generate_cache_key(image_data, params2)
    
    assert key1 != key2
