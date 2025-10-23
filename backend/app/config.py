from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    backend_workers: int = 4
    debug: bool = False
    
    redis_host: str = "redis"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: Optional[str] = None
    
    cache_enabled: bool = True
    cache_ttl: int = 3600
    cache_max_size: int = 1000
    
    max_upload_size: int = 52428800
    chunk_size: int = 1048576
    allowed_extensions: str = "png,jpg,jpeg,bmp,gif,tiff"
    
    vectorization_timeout: int = 300
    streaming_enabled: bool = True
    background_processing: bool = True
    
    max_image_dimension: int = 4096
    compression_quality: int = 85
    worker_pool_size: int = 4
    
    monitoring_enabled: bool = True
    metrics_port: int = 9090
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
