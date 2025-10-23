.PHONY: help install dev test clean build deploy

help:
	@echo "Image2SVG - Development Commands"
	@echo ""
	@echo "Setup Commands:"
	@echo "  make install       - Install all dependencies"
	@echo "  make dev           - Start development environment"
	@echo ""
	@echo "Testing Commands:"
	@echo "  make test          - Run all tests"
	@echo "  make test-unit     - Run unit tests only"
	@echo "  make test-e2e      - Run E2E tests only"
	@echo "  make test-coverage - Generate coverage report"
	@echo ""
	@echo "Build Commands:"
	@echo "  make build         - Build Docker images"
	@echo "  make up            - Start all services"
	@echo "  make down          - Stop all services"
	@echo "  make logs          - View service logs"
	@echo ""
	@echo "Quality Commands:"
	@echo "  make lint          - Run linters"
	@echo "  make format        - Format code"
	@echo ""
	@echo "Maintenance Commands:"
	@echo "  make clean         - Clean temporary files"
	@echo "  make fixtures      - Generate test fixtures"

# Setup
install:
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installing test dependencies..."
	cd tests && npm install

# Development
dev:
	@echo "Starting development environment..."
	docker-compose up -d redis
	@echo "Redis started on localhost:6379"
	@echo ""
	@echo "To start backend: cd backend && uvicorn app.main:app --reload"
	@echo "To start frontend: cd frontend && npm run dev"

dev-backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev

# Testing
test: test-unit test-e2e

test-unit:
	@echo "Running unit tests..."
	cd backend && pytest -v

test-e2e:
	@echo "Running E2E tests..."
	cd tests && npm test

test-coverage:
	@echo "Generating coverage report..."
	cd backend && pytest --cov=app --cov-report=html --cov-report=term
	@echo "Coverage report generated in backend/htmlcov/index.html"

test-watch:
	cd backend && pytest-watch

# Build and Deploy
build:
	@echo "Building Docker images..."
	docker-compose build

up:
	@echo "Starting all services..."
	docker-compose up -d
	@echo "Services started!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"
	@echo "Prometheus: http://localhost:9090"

down:
	@echo "Stopping all services..."
	docker-compose down

restart:
	@echo "Restarting services..."
	docker-compose restart

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

# Code Quality
lint:
	@echo "Running backend linters..."
	cd backend && flake8 app/
	@echo "Checking frontend..."
	cd frontend && npm run lint

format:
	@echo "Formatting backend code..."
	cd backend && black app/
	@echo "Formatting frontend code..."
	cd frontend && npm run format

# Maintenance
clean:
	@echo "Cleaning temporary files..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "build" -exec rm -rf {} + 2>/dev/null || true
	rm -rf backend/htmlcov
	rm -rf tests/playwright-report
	rm -rf tests/test-results
	@echo "Cleaned!"

fixtures:
	@echo "Generating test fixtures..."
	pip install pillow
	cd tests/fixtures && python3 generate_fixtures.py

# Health checks
health:
	@echo "Checking service health..."
	@curl -f http://localhost:8000/health || echo "Backend not responding"
	@curl -f http://localhost:3000 || echo "Frontend not responding"

# Database/Cache
redis-cli:
	docker exec -it image2svg-redis redis-cli

cache-stats:
	@curl -s http://localhost:8000/cache/stats | python3 -m json.tool

# Monitoring
metrics:
	@curl -s http://localhost:8000/metrics

# Documentation
docs:
	@echo "Documentation:"
	@echo "  README.md         - Project overview"
	@echo "  PERFORMANCE.md    - Performance guidelines"
	@echo "  DEPLOYMENT.md     - Deployment guide"
	@echo "  TESTING.md        - Testing guide"
	@echo "  CONTRIBUTING.md   - Contribution guidelines"
	@echo ""
	@echo "API Documentation: http://localhost:8000/docs"

# Production
prod-up:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

prod-down:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# Backup
backup:
	@echo "Creating backup..."
	mkdir -p backups
	docker exec image2svg-redis redis-cli BGSAVE
	docker cp image2svg-redis:/data/dump.rdb backups/redis_$(shell date +%Y%m%d_%H%M%S).rdb
	@echo "Backup completed!"
