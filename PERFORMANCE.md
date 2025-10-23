# Performance Guidelines

This document outlines performance optimization strategies and best practices for the Image to SVG Converter service.

## Performance Features

### 1. Intelligent Caching

The application uses Redis for caching vectorization results based on:
- Image content hash (using xxhash for speed)
- Processing parameters

**Benefits:**
- Instant responses for repeated conversions
- Reduced CPU and memory usage
- Lower latency for common requests

**Configuration:**
```env
CACHE_ENABLED=true
CACHE_TTL=3600  # 1 hour
CACHE_MAX_SIZE=1000
```

**Cache Key Generation:**
```python
# Cache key format: svg:{xxhash64(image_data + params)}
key = f"svg:{xxhash.xxh64(image_data + json.dumps(params)).hexdigest()}"
```

### 2. Streaming Responses

For large images, use streaming mode to start sending SVG data before processing is complete.

**When to use:**
- Images larger than 2MB
- Real-time progress feedback required
- Limited client memory

**API Usage:**
```bash
curl -X POST http://localhost:8000/convert/streaming \
  -F "file=@large-image.png" \
  -F "simplify=true"
```

**Performance Impact:**
- Reduces time-to-first-byte
- Better user experience for large files
- Lower memory footprint

### 3. Background Processing

Submit conversion jobs to background queue for non-blocking execution.

**When to use:**
- Very large images (>5MB)
- Batch processing
- Long-running conversions
- API rate limiting scenarios

**API Usage:**
```bash
# Submit job
curl -X POST http://localhost:8000/convert/background \
  -F "file=@image.png"
# Response: {"task_id": "uuid", "status_url": "/tasks/uuid"}

# Poll status
curl http://localhost:8000/tasks/{uuid}

# Get result
curl http://localhost:8000/tasks/{uuid}/result
```

### 4. Chunked Uploads

For very large files, use chunked uploads to avoid timeouts and memory issues.

**Implementation:**
```javascript
const chunkSize = 1024 * 1024; // 1MB chunks
const totalChunks = Math.ceil(file.size / chunkSize);
const uploadId = generateUUID();

for (let i = 0; i < totalChunks; i++) {
  const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);
  const formData = new FormData();
  formData.append('chunk', chunk);
  formData.append('chunk_number', i);
  formData.append('total_chunks', totalChunks);
  formData.append('upload_id', uploadId);
  
  await fetch('/upload/chunked', {
    method: 'POST',
    body: formData
  });
}
```

### 5. Image Preprocessing Optimizations

**Automatic Resizing:**
```env
MAX_IMAGE_DIMENSION=4096
```
- Images larger than 4096px are automatically downscaled
- Maintains aspect ratio
- Reduces processing time significantly

**Processing Pipeline:**
1. **Format Conversion** (RGBA → RGB)
2. **Resize** (if needed)
3. **Enhancement** (optional, adds ~15% processing time)
4. **Thresholding** (binary conversion)
5. **Vectorization**

### 6. Worker Pool Configuration

Configure worker threads for concurrent processing:

```env
WORKER_POOL_SIZE=4  # Number of CPU cores
BACKEND_WORKERS=4   # Uvicorn workers
```

**Guidelines:**
- Set WORKER_POOL_SIZE to number of CPU cores
- For CPU-bound workloads: workers = cores
- For I/O-bound workloads: workers = cores * 2

## Performance Profiling

### Built-in Profiling

Every conversion includes timing metadata:

```python
{
  'original_size': (4000, 3000),
  'resized': true,
  'resize_time_ms': 145.2,
  'enhance_time_ms': 89.3,
  'threshold_time_ms': 23.1,
  'total_time_ms': 257.6
}
```

### Monitoring Metrics

Access metrics at `http://localhost:8000/metrics`:

- `processing_seconds_bucket`: Processing time distribution
- `processing_seconds_sum`: Total processing time
- `processing_seconds_count`: Number of conversions
- `cache_hits_total`: Cache hit count
- `vectorizations_total{cached="true"}`: Cached conversions
- `vectorizations_total{cached="false"}`: Uncached conversions

### Prometheus Queries

**Average processing time:**
```promql
rate(processing_seconds_sum[5m]) / rate(processing_seconds_count[5m])
```

**Cache hit rate:**
```promql
cache_hits_total / (cache_hits_total + vectorizations_total{cached="false"})
```

**95th percentile processing time:**
```promql
histogram_quantile(0.95, processing_seconds_bucket)
```

## Performance Benchmarks

### Small Images (< 500KB)

| Mode | Size | Cached | Uncached | Memory |
|------|------|--------|----------|--------|
| Binary | 100x100 | <10ms | ~50ms | 5MB |
| Binary | 500x500 | <10ms | ~200ms | 15MB |
| Grayscale | 100x100 | <10ms | ~80ms | 8MB |

### Medium Images (500KB - 2MB)

| Mode | Size | Cached | Uncached | Memory |
|------|------|--------|----------|--------|
| Binary | 1000x1000 | <10ms | ~800ms | 40MB |
| Binary | 2000x2000 | <10ms | ~3.2s | 120MB |

### Large Images (> 2MB)

| Mode | Size | Cached | Uncached | Memory |
|------|------|--------|----------|--------|
| Binary | 4000x3000 | <10ms | ~8s | 300MB |
| Streaming | 4000x3000 | N/A | ~8s | 80MB |

## Optimization Recommendations

### 1. For Web Applications

```javascript
// Use appropriate mode based on file size
const mode = file.size < 2 * 1024 * 1024 ? 'standard' : 'streaming';
const endpoint = mode === 'streaming' ? '/convert/streaming' : '/convert';
```

### 2. For Batch Processing

```python
# Use background processing for batches
import asyncio

async def batch_convert(images):
    tasks = []
    for img in images:
        task_id = await submit_background_task(img)
        tasks.append(task_id)
    
    # Poll all tasks
    results = await asyncio.gather(*[
        poll_task(task_id) for task_id in tasks
    ])
    return results
```

### 3. For High-Traffic Scenarios

- Enable Redis clustering
- Use multiple backend instances behind load balancer
- Set appropriate cache TTL based on usage patterns
- Monitor cache hit rate and adjust strategy

### 4. Memory Management

```env
# Limit memory usage
MAX_UPLOAD_SIZE=52428800  # 50MB
MAX_IMAGE_DIMENSION=4096
```

### 5. Simplification Strategy

```python
# Use simplification for faster processing
# Trade-off: slight quality reduction for 2-3x speed improvement
{
    'simplify': True,  # Recommended for most use cases
    'color_mode': 'binary'  # Faster than grayscale
}
```

## Troubleshooting Performance Issues

### High Memory Usage

**Symptoms:**
- OOM errors
- Slow processing

**Solutions:**
1. Reduce `MAX_IMAGE_DIMENSION`
2. Reduce `MAX_UPLOAD_SIZE`
3. Increase server memory
4. Use streaming mode

### Slow Processing

**Symptoms:**
- Long response times
- Timeouts

**Solutions:**
1. Enable caching
2. Increase `WORKER_POOL_SIZE`
3. Use background processing
4. Add more backend instances

### Cache Misses

**Symptoms:**
- Low cache hit rate
- Inconsistent performance

**Solutions:**
1. Increase `CACHE_TTL`
2. Normalize image preprocessing parameters
3. Use consistent parameter defaults
4. Monitor cache statistics

### High CPU Usage

**Symptoms:**
- 100% CPU utilization
- Slow response times

**Solutions:**
1. Reduce `BACKEND_WORKERS`
2. Use background processing
3. Enable request queuing
4. Add more CPU cores

## Best Practices

1. **Always enable caching** for production deployments
2. **Use streaming mode** for images > 2MB
3. **Implement retry logic** for background tasks
4. **Monitor cache hit rates** and adjust TTL accordingly
5. **Set appropriate timeouts** based on expected image sizes
6. **Use simplification** unless high precision is required
7. **Profile regularly** to identify bottlenecks
8. **Scale horizontally** for high traffic scenarios

## Future Optimizations

- GPU acceleration for preprocessing
- Multi-level caching (L1: memory, L2: Redis)
- Adaptive processing based on image characteristics
- WebAssembly for client-side preprocessing
- CDN integration for cached results
