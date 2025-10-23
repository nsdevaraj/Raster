# Image to SVG Converter

A high-performance image vectorization service with intelligent caching, streaming responses, and comprehensive monitoring.

## Features

- **High-Performance Vectorization**: Convert raster images to SVG format with optimized algorithms
- **Intelligent Caching**: Redis-based caching system for similar jobs with hash-based key generation
- **Streaming Responses**: Support for large images with chunked processing
- **Background Processing**: Non-blocking task execution for better responsiveness
- **Chunked Uploads**: Handle large files with efficient chunked upload mechanism
- **Multiple Conversion Modes**: Binary and grayscale vectorization options
- **Comprehensive Monitoring**: Prometheus metrics for performance tracking
- **End-to-End Testing**: Full Playwright test suite for quality assurance

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Frontend   │─────▶│   Backend   │─────▶│    Redis    │
│   (React)   │      │  (FastAPI)  │      │   (Cache)   │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │ Prometheus  │
                     │ (Metrics)   │
                     └─────────────┘
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd image2svg

# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f backend
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Prometheus: http://localhost:9090

### Local Development

#### Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start Redis (required)
docker run -d -p 6379:6379 redis:7-alpine

# Run the backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## API Endpoints

### Convert Image (Standard)
```http
POST /convert
Content-Type: multipart/form-data

Parameters:
- file: Image file (required)
- resize: bool (default: true)
- enhance: bool (default: false)
- threshold: int | null (default: null)
- color_mode: 'binary' | 'grayscale' (default: 'binary')
- simplify: bool (default: true)
- use_cache: bool (default: true)
```

### Convert Image (Streaming)
```http
POST /convert/streaming
Content-Type: multipart/form-data

Same parameters as /convert, but returns streaming response
```

### Convert Image (Background)
```http
POST /convert/background
Content-Type: multipart/form-data

Returns task ID immediately for status polling
```

### Check Task Status
```http
GET /tasks/{task_id}

Returns task status and progress
```

### Get Task Result
```http
GET /tasks/{task_id}/result

Returns SVG result when task is complete
```

### Upload Chunk
```http
POST /upload/chunked

Parameters:
- chunk: File chunk
- chunk_number: int
- total_chunks: int
- upload_id: string
```

### Health Check
```http
GET /health

Returns service health status and cache statistics
```

### Metrics
```http
GET /metrics

Returns Prometheus metrics
```

## Performance Guidelines

See [PERFORMANCE.md](PERFORMANCE.md) for detailed performance tuning guidelines.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions and configuration.

## Testing

### Unit Tests

```bash
cd backend
pytest tests/ -v --cov=app
```

### End-to-End Tests

```bash
cd tests

# Install dependencies
npm install

# Run tests
npm test

# Run tests in headed mode
npm run test:headed

# Run tests with UI
npm run test:ui
```

### Test Coverage

The E2E test suite covers:
- Complete upload-to-export workflow
- Different conversion options
- Streaming and background processing
- Error handling
- Cache functionality
- SVG output quality regression tests
- Visual consistency checks

## Configuration

Configuration is managed through environment variables. Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

Key configuration options:
- `CACHE_ENABLED`: Enable/disable Redis caching
- `STREAMING_ENABLED`: Enable/disable streaming responses
- `BACKGROUND_PROCESSING`: Enable/disable background task processing
- `MAX_UPLOAD_SIZE`: Maximum file size in bytes
- `VECTORIZATION_TIMEOUT`: Processing timeout in seconds
- `WORKER_POOL_SIZE`: Number of worker threads

## Monitoring

### Prometheus Metrics

The application exposes the following metrics:

- `uploads_total`: Total number of uploads
- `vectorizations_total`: Total vectorizations (with cache label)
- `processing_seconds`: Processing time histogram
- `cache_hits_total`: Cache hit count

### Cache Statistics

```http
GET /cache/stats
```

Returns:
- enabled: Whether cache is enabled
- hits: Number of cache hits
- misses: Number of cache misses
- total_keys: Total keys in cache

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details
# Raster to SVG Studio

A modern web application scaffold for converting raster images to optimized SVGs. This project is built with [Vite](https://vitejs.dev/), [React](https://react.dev/), and a set of core libraries that power routing, state management, styling, and raster tracing.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173).

### Available Scripts

- `npm run dev` – start the development server.
- `npm run build` – create a production build in the `dist/` directory.
- `npm run preview` – locally preview a production build.
- `npm run lint` – run ESLint against all JavaScript and JSX files.
- `npm run format` – format the codebase with Prettier.

## Technology Stack

- **React + Vite** – fast development server and production build tooling.
- **React Router** – client-side routing.
- **Zustand** – lightweight global state store for conversion settings and trace results.
- **Emotion** – themeable styling primitives and global styles.
- **potrace-wasm** – WebAssembly-powered raster-to-SVG tracing engine.
- **SVGO** – optimization pipeline to refine generated SVG markup.
- **clsx** – conditional class name helper.

## Project Structure

```
├── src
│   ├── components
│   │   ├── layout          # App shell, header, main content, sidebar
│   │   └── panels          # Upload, settings, and preview panels
│   ├── hooks               # Custom hooks (e.g., tracing workflow)
│   ├── providers           # Application-level providers (theme, etc.)
│   ├── routes              # Route configuration and views
│   ├── store               # Zustand global store definitions
│   ├── styles              # Global CSS and theme tokens
│   ├── utils               # Future utility helpers
│   └── workers             # Potrace + SVGO tracing orchestration
├── index.html              # Vite entry point
├── vite.config.js          # Vite configuration with module aliases
├── .eslintrc.cjs           # ESLint configuration (React + Prettier)
├── .prettierrc             # Prettier formatting preferences
└── package.json            # Dependencies and scripts
```

## Development Notes

- The tracing workflow lives in `src/hooks/useTraceWorker.js` and delegates to `src/workers/potraceWorker.js` where Potrace and SVGO are orchestrated.
- The global theme is defined in `src/styles/theme.js` and provided via Emotion's `ThemeProvider` in `src/providers/AppProviders.jsx`.
- Routing is set up in `src/routes/AppRoutes.jsx`, with an initial `Home` view that wires together upload, settings, and vector preview panels.

This scaffold is ready for further feature development—implement additional panels, extend the tracing worker, or integrate collaboration features as needed.
