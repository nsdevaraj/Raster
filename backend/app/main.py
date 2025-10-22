from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response
import logging
import uuid
from typing import Optional
import time

from .config import settings
from .cache import cache_manager
from .preprocessing import preprocessor
from .vectorizer import vectorizer
from .tasks import task_manager

logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Image to SVG Converter API",
    description="High-performance image vectorization service with caching and streaming",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_counter = Counter('uploads_total', 'Total number of uploads')
vectorization_counter = Counter('vectorizations_total', 'Total vectorizations', ['cached'])
processing_time_histogram = Histogram('processing_seconds', 'Processing time in seconds')
cache_hit_counter = Counter('cache_hits_total', 'Cache hit count')


@app.on_event("startup")
async def startup_event():
    """Initialize connections on startup"""
    logger.info("Starting Image to SVG Converter API")
    await cache_manager.connect()
    logger.info("Application startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down API")
    await cache_manager.disconnect()
    logger.info("Application shutdown complete")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Image to SVG Converter",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    cache_stats = await cache_manager.get_stats()
    return {
        "status": "healthy",
        "cache": cache_stats,
        "settings": {
            "streaming_enabled": settings.streaming_enabled,
            "background_processing": settings.background_processing,
            "max_upload_size": settings.max_upload_size
        }
    }


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    if not settings.monitoring_enabled:
        raise HTTPException(status_code=404, detail="Metrics not enabled")
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.post("/convert")
async def convert_image(
    file: UploadFile = File(...),
    resize: bool = True,
    enhance: bool = False,
    threshold: Optional[int] = None,
    color_mode: str = 'binary',
    simplify: bool = True,
    use_cache: bool = True
):
    """
    Convert an image to SVG format (non-streaming)
    
    Args:
        file: Image file to convert
        resize: Resize large images for better performance
        enhance: Apply image enhancement
        threshold: Binary threshold value (None for auto)
        color_mode: 'binary' or 'grayscale'
        simplify: Simplify SVG paths
        use_cache: Use cached results if available
    """
    start_time = time.time()
    upload_counter.inc()
    
    try:
        if file.size and file.size > settings.max_upload_size:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size: {settings.max_upload_size} bytes"
            )
        
        image_data = await file.read()
        
        params = {
            'resize': resize,
            'enhance': enhance,
            'threshold': threshold,
            'color_mode': color_mode,
            'simplify': simplify
        }
        
        cache_key = cache_manager.generate_cache_key(image_data, params)
        
        if use_cache:
            cached_svg = await cache_manager.get(cache_key)
            if cached_svg:
                cache_hit_counter.inc()
                vectorization_counter.labels(cached='true').inc()
                logger.info("Serving result from cache")
                return Response(
                    content=cached_svg,
                    media_type="image/svg+xml",
                    headers={"X-Cache": "HIT"}
                )
        
        image_array, metadata = await preprocessor.preprocess(
            image_data,
            resize=resize,
            enhance=enhance,
            threshold=threshold
        )
        
        svg_result = await vectorizer.vectorize(
            image_array,
            color_mode=color_mode,
            simplify=simplify
        )
        
        if use_cache:
            await cache_manager.set(cache_key, svg_result.encode('utf-8'))
        
        processing_time = time.time() - start_time
        processing_time_histogram.observe(processing_time)
        vectorization_counter.labels(cached='false').inc()
        
        return Response(
            content=svg_result,
            media_type="image/svg+xml",
            headers={
                "X-Cache": "MISS",
                "X-Processing-Time": f"{processing_time:.3f}s",
                "X-Metadata": str(metadata)
            }
        )
        
    except Exception as e:
        logger.error(f"Conversion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/convert/streaming")
async def convert_image_streaming(
    file: UploadFile = File(...),
    resize: bool = True,
    enhance: bool = False,
    threshold: Optional[int] = None,
    color_mode: str = 'binary',
    simplify: bool = True
):
    """
    Convert an image to SVG format with streaming response
    Useful for large images that take significant time to process
    """
    if not settings.streaming_enabled:
        raise HTTPException(status_code=503, detail="Streaming not enabled")
    
    upload_counter.inc()
    
    try:
        if file.size and file.size > settings.max_upload_size:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size: {settings.max_upload_size} bytes"
            )
        
        image_data = await file.read()
        
        image_array, metadata = await preprocessor.preprocess(
            image_data,
            resize=resize,
            enhance=enhance,
            threshold=threshold
        )
        
        async def generate():
            async for chunk in vectorizer.vectorize_streaming(
                image_array,
                color_mode=color_mode,
                simplify=simplify
            ):
                yield chunk
        
        vectorization_counter.labels(cached='false').inc()
        
        return StreamingResponse(
            generate(),
            media_type="image/svg+xml",
            headers={"X-Streaming": "true"}
        )
        
    except Exception as e:
        logger.error(f"Streaming conversion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/convert/background")
async def convert_image_background(
    file: UploadFile = File(...),
    resize: bool = True,
    enhance: bool = False,
    threshold: Optional[int] = None,
    color_mode: str = 'binary',
    simplify: bool = True
):
    """
    Submit image conversion as a background task
    Returns immediately with a task ID for status checking
    """
    if not settings.background_processing:
        raise HTTPException(status_code=503, detail="Background processing not enabled")
    
    upload_counter.inc()
    
    try:
        if file.size and file.size > settings.max_upload_size:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size: {settings.max_upload_size} bytes"
            )
        
        image_data = await file.read()
        task_id = str(uuid.uuid4())
        
        params = {
            'resize': resize,
            'enhance': enhance,
            'threshold': threshold,
            'color_mode': color_mode,
            'simplify': simplify
        }
        
        await task_manager.submit_vectorization_task(task_id, image_data, params)
        
        return JSONResponse({
            "task_id": task_id,
            "status": "submitted",
            "status_url": f"/tasks/{task_id}"
        })
        
    except Exception as e:
        logger.error(f"Background task submission error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    """Get the status of a background task"""
    task_status = task_manager.get_task_status(task_id)
    
    if task_status is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return task_status


@app.get("/tasks/{task_id}/result")
async def get_task_result(task_id: str):
    """Get the result of a completed background task"""
    task_status = task_manager.get_task_status(task_id)
    
    if task_status is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task_status['status'] != 'completed':
        return JSONResponse({
            "status": task_status['status'],
            "message": "Task not yet completed"
        })
    
    if 'error' in task_status:
        raise HTTPException(status_code=500, detail=task_status['error'])
    
    return Response(
        content=task_status['result'],
        media_type="image/svg+xml",
        headers={
            "X-Task-ID": task_id,
            "X-From-Cache": str(task_status.get('from_cache', False))
        }
    )


@app.post("/upload/chunked")
async def upload_chunk(
    chunk: UploadFile = File(...),
    chunk_number: int = 0,
    total_chunks: int = 1,
    upload_id: str = ""
):
    """
    Handle chunked file uploads for large images
    
    Args:
        chunk: File chunk
        chunk_number: Current chunk number (0-indexed)
        total_chunks: Total number of chunks
        upload_id: Unique upload session ID
    """
    try:
        if not upload_id:
            upload_id = str(uuid.uuid4())
        
        chunk_data = await chunk.read()
        
        cache_key = f"upload:{upload_id}:chunk:{chunk_number}"
        await cache_manager.set(cache_key, chunk_data, ttl=3600)
        
        if chunk_number == total_chunks - 1:
            full_data = bytearray()
            for i in range(total_chunks):
                chunk_key = f"upload:{upload_id}:chunk:{i}"
                chunk_content = await cache_manager.get(chunk_key)
                if chunk_content:
                    full_data.extend(chunk_content)
            
            return {
                "status": "complete",
                "upload_id": upload_id,
                "total_size": len(full_data),
                "message": "All chunks received"
            }
        
        return {
            "status": "partial",
            "upload_id": upload_id,
            "chunk_number": chunk_number,
            "total_chunks": total_chunks
        }
        
    except Exception as e:
        logger.error(f"Chunk upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/cache/stats")
async def get_cache_stats():
    """Get cache statistics"""
    return await cache_manager.get_stats()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.backend_host,
        port=settings.backend_port,
        workers=settings.backend_workers
    )
