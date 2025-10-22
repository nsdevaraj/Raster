# Deployment Guide

This guide covers deployment strategies, configuration, and best practices for the Image to SVG Converter service.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Docker Deployment](#docker-deployment)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [Cloud Deployments](#cloud-deployments)
5. [Environment Configuration](#environment-configuration)
6. [Monitoring Setup](#monitoring-setup)
7. [Security](#security)
8. [Scaling](#scaling)
9. [Backup and Recovery](#backup-and-recovery)

## Prerequisites

### Required
- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum (4GB recommended)
- 2 CPU cores minimum (4 recommended)

### Optional
- Kubernetes 1.24+
- Helm 3.0+
- Redis Cluster (for high availability)
- Load Balancer
- SSL/TLS certificates

## Docker Deployment

### Single Server Deployment

```bash
# Clone repository
git clone <repository-url>
cd image2svg

# Copy and configure environment
cp .env.example .env
nano .env  # Edit configuration

# Build and start services
docker-compose up -d

# Verify deployment
docker-compose ps
curl http://localhost:8000/health
```

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    restart: always
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - DEBUG=false
      - LOG_LEVEL=INFO
    restart: always
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: always
    deploy:
      replicas: 2

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    restart: always

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana-data:/var/lib/grafana
    restart: always

volumes:
  redis-data:
  prometheus-data:
  grafana-data:
```

Deploy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Kubernetes Deployment

### Create Namespace

```bash
kubectl create namespace image2svg
```

### Deploy Redis

`k8s/redis-deployment.yaml`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: image2svg
spec:
  ports:
    - port: 6379
      targetPort: 6379
  selector:
    app: redis
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: image2svg
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        volumeMounts:
        - name: redis-storage
          mountPath: /data
      volumes:
      - name: redis-storage
        persistentVolumeClaim:
          claimName: redis-pvc
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redis-pvc
  namespace: image2svg
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

### Deploy Backend

`k8s/backend-deployment.yaml`:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
  namespace: image2svg
data:
  REDIS_HOST: redis
  REDIS_PORT: "6379"
  CACHE_ENABLED: "true"
  STREAMING_ENABLED: "true"
  BACKGROUND_PROCESSING: "true"
  LOG_LEVEL: INFO
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: image2svg
spec:
  type: ClusterIP
  ports:
    - port: 8000
      targetPort: 8000
  selector:
    app: backend
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: image2svg
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: image2svg-backend:latest
        ports:
        - containerPort: 8000
        envFrom:
        - configMapRef:
            name: backend-config
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2000m
            memory: 2Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Deploy Frontend

`k8s/frontend-deployment.yaml`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: image2svg
spec:
  type: LoadBalancer
  ports:
    - port: 80
      targetPort: 80
  selector:
    app: frontend
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: image2svg
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: image2svg-frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

### Deploy Ingress

`k8s/ingress.yaml`:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: image2svg-ingress
  namespace: image2svg
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - image2svg.example.com
    secretName: image2svg-tls
  rules:
  - host: image2svg.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 8000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
```

### Apply Kubernetes Manifests

```bash
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Verify deployment
kubectl get pods -n image2svg
kubectl get services -n image2svg
```

## Cloud Deployments

### AWS (ECS)

1. **Create ECR Repositories:**
```bash
aws ecr create-repository --repository-name image2svg-backend
aws ecr create-repository --repository-name image2svg-frontend
```

2. **Build and Push Images:**
```bash
# Backend
docker build -t image2svg-backend backend/
docker tag image2svg-backend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/image2svg-backend:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/image2svg-backend:latest

# Frontend
docker build -t image2svg-frontend frontend/
docker tag image2svg-frontend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/image2svg-frontend:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/image2svg-frontend:latest
```

3. **Create ECS Task Definition and Service**

### Google Cloud (Cloud Run)

```bash
# Backend
gcloud builds submit --tag gcr.io/PROJECT_ID/image2svg-backend backend/
gcloud run deploy backend \
  --image gcr.io/PROJECT_ID/image2svg-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Frontend
gcloud builds submit --tag gcr.io/PROJECT_ID/image2svg-frontend frontend/
gcloud run deploy frontend \
  --image gcr.io/PROJECT_ID/image2svg-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Azure (Container Instances)

```bash
# Create resource group
az group create --name image2svg --location eastus

# Deploy backend
az container create \
  --resource-group image2svg \
  --name backend \
  --image <registry>/image2svg-backend:latest \
  --cpu 2 --memory 4 \
  --ports 8000

# Deploy frontend
az container create \
  --resource-group image2svg \
  --name frontend \
  --image <registry>/image2svg-frontend:latest \
  --cpu 1 --memory 1 \
  --ports 80
```

## Environment Configuration

### Production Environment Variables

```env
# Backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
BACKEND_WORKERS=4
DEBUG=false

# Redis
REDIS_HOST=redis.prod.internal
REDIS_PORT=6379
REDIS_PASSWORD=<secure-password>

# Cache
CACHE_ENABLED=true
CACHE_TTL=7200
CACHE_MAX_SIZE=10000

# Upload
MAX_UPLOAD_SIZE=104857600  # 100MB
CHUNK_SIZE=2097152  # 2MB
ALLOWED_EXTENSIONS=png,jpg,jpeg,bmp,gif,tiff

# Performance
VECTORIZATION_TIMEOUT=600
STREAMING_ENABLED=true
BACKGROUND_PROCESSING=true
MAX_IMAGE_DIMENSION=8192
WORKER_POOL_SIZE=8

# Monitoring
MONITORING_ENABLED=true
LOG_LEVEL=INFO

# Security
CORS_ORIGINS=https://yourdomain.com
API_KEY_REQUIRED=true
RATE_LIMIT=100
```

### Secrets Management

**Using Docker Secrets:**
```bash
echo "my-redis-password" | docker secret create redis_password -
```

**Using Kubernetes Secrets:**
```bash
kubectl create secret generic redis-password \
  --from-literal=password=my-redis-password \
  -n image2svg
```

## Monitoring Setup

### Grafana Dashboard

Import the provided Grafana dashboard:

`monitoring/grafana-dashboard.json`:
```json
{
  "dashboard": {
    "title": "Image2SVG Performance",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "rate(uploads_total[5m])"
        }]
      },
      {
        "title": "Cache Hit Rate",
        "targets": [{
          "expr": "cache_hits_total / (cache_hits_total + vectorizations_total{cached='false'})"
        }]
      },
      {
        "title": "Processing Time P95",
        "targets": [{
          "expr": "histogram_quantile(0.95, processing_seconds_bucket)"
        }]
      }
    ]
  }
}
```

### Log Aggregation

**Using ELK Stack:**
```yaml
# docker-compose.logging.yml
services:
  elasticsearch:
    image: elasticsearch:8.5.0
    environment:
      - discovery.type=single-node

  logstash:
    image: logstash:8.5.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf

  kibana:
    image: kibana:8.5.0
    ports:
      - "5601:5601"
```

### Alerting

Configure Prometheus alerts in `monitoring/alerts.yml`:
```yaml
groups:
  - name: image2svg
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: High error rate detected

      - alert: LowCacheHitRate
        expr: cache_hits_total / (cache_hits_total + vectorizations_total) < 0.5
        for: 10m
        annotations:
          summary: Cache hit rate below 50%
```

## Security

### SSL/TLS Configuration

**Using Let's Encrypt with nginx:**
```nginx
server {
    listen 443 ssl http2;
    server_name image2svg.example.com;

    ssl_certificate /etc/letsencrypt/live/image2svg.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/image2svg.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://frontend:80;
    }

    location /api {
        proxy_pass http://backend:8000;
    }
}
```

### API Authentication

Add API key middleware to backend:
```python
# app/middleware.py
from fastapi import Request, HTTPException

async def api_key_middleware(request: Request, call_next):
    if settings.api_key_required:
        api_key = request.headers.get("X-API-Key")
        if not api_key or api_key != settings.api_key:
            raise HTTPException(status_code=401, detail="Invalid API key")
    return await call_next(request)
```

### Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/convert")
@limiter.limit("100/hour")
async def convert_image(...):
    ...
```

## Scaling

### Horizontal Scaling

**Docker Compose:**
```bash
docker-compose up -d --scale backend=5
```

**Kubernetes:**
```bash
kubectl scale deployment backend --replicas=10 -n image2svg
```

**Auto-scaling (Kubernetes):**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: image2svg
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Load Balancing

**nginx configuration:**
```nginx
upstream backend {
    least_conn;
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}

server {
    location /api {
        proxy_pass http://backend;
    }
}
```

## Backup and Recovery

### Redis Backup

```bash
# Manual backup
docker exec image2svg-redis redis-cli BGSAVE

# Copy backup
docker cp image2svg-redis:/data/dump.rdb ./backups/

# Restore
docker cp ./backups/dump.rdb image2svg-redis:/data/
docker restart image2svg-redis
```

### Automated Backup Script

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR=/backups/image2svg
DATE=$(date +%Y%m%d_%H%M%S)

# Backup Redis
docker exec image2svg-redis redis-cli BGSAVE
docker cp image2svg-redis:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Backup Prometheus data
docker cp image2svg-prometheus:/prometheus $BACKUP_DIR/prometheus_$DATE

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -mtime +7 -delete

echo "Backup completed: $DATE"
```

### Disaster Recovery

1. **Stop services:**
```bash
docker-compose down
```

2. **Restore Redis:**
```bash
docker cp ./backups/latest/redis.rdb redis-data/dump.rdb
```

3. **Restart services:**
```bash
docker-compose up -d
```

## Health Checks

### Application Health Check

```bash
#!/bin/bash
# healthcheck.sh

BACKEND_URL=http://localhost:8000/health
FRONTEND_URL=http://localhost:3000

# Check backend
if curl -f $BACKEND_URL > /dev/null 2>&1; then
    echo "✓ Backend is healthy"
else
    echo "✗ Backend is down"
    exit 1
fi

# Check frontend
if curl -f $FRONTEND_URL > /dev/null 2>&1; then
    echo "✓ Frontend is healthy"
else
    echo "✗ Frontend is down"
    exit 1
fi
```

### Monitoring Health Check

```bash
# Add to crontab for periodic checks
*/5 * * * * /path/to/healthcheck.sh || /path/to/alert.sh
```

## Troubleshooting

### Common Issues

1. **Redis Connection Failed:**
   - Check Redis is running: `docker ps | grep redis`
   - Verify network connectivity
   - Check Redis password configuration

2. **High Memory Usage:**
   - Reduce MAX_IMAGE_DIMENSION
   - Increase cache eviction
   - Add more replicas

3. **Slow Performance:**
   - Check cache hit rate
   - Increase worker pool size
   - Add more backend instances

### Debug Mode

```env
DEBUG=true
LOG_LEVEL=DEBUG
```

### Logs

```bash
# View logs
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend

# Specific timeframe
docker-compose logs --since 30m backend
```

## Maintenance

### Rolling Updates

```bash
# Build new image
docker-compose build backend

# Rolling update (zero downtime)
docker-compose up -d --no-deps --scale backend=6
docker-compose up -d --no-deps --scale backend=3
```

### Database Migration

(If adding database in future)
```bash
# Backup before migration
./backup.sh

# Run migration
docker-compose run backend alembic upgrade head
```

## Summary

This deployment guide covers:
- ✅ Docker and Kubernetes deployments
- ✅ Cloud platform deployments (AWS, GCP, Azure)
- ✅ Security configuration
- ✅ Monitoring and alerting
- ✅ Scaling strategies
- ✅ Backup and recovery
- ✅ Troubleshooting

For additional support, consult the [README.md](README.md) and [PERFORMANCE.md](PERFORMANCE.md).
