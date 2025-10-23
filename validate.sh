#!/bin/bash
# Validation script to check if all required files are present

echo "🔍 Validating Image2SVG Implementation..."
echo ""

errors=0

# Check critical files
critical_files=(
    "README.md"
    "PERFORMANCE.md"
    "DEPLOYMENT.md"
    "TESTING.md"
    ".gitignore"
    ".env.example"
    "docker-compose.yml"
    "Makefile"
    "backend/app/main.py"
    "backend/app/cache.py"
    "backend/app/vectorizer.py"
    "backend/app/preprocessing.py"
    "backend/app/tasks.py"
    "backend/Dockerfile"
    "backend/requirements.txt"
    "frontend/src/App.tsx"
    "frontend/Dockerfile"
    "frontend/package.json"
    "tests/e2e/upload-workflow.spec.ts"
    "tests/e2e/svg-quality.spec.ts"
    "tests/playwright.config.ts"
    ".github/workflows/test.yml"
)

echo "Checking critical files..."
for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ Missing: $file"
        ((errors++))
    fi
done

echo ""
echo "Checking documentation completeness..."

# Check README sections
if grep -q "Performance" README.md && \
   grep -q "Architecture" README.md && \
   grep -q "API Endpoints" README.md; then
    echo "  ✅ README.md has required sections"
else
    echo "  ❌ README.md missing required sections"
    ((errors++))
fi

# Check PERFORMANCE.md sections
if grep -q "Streaming" PERFORMANCE.md && \
   grep -q "Caching" PERFORMANCE.md && \
   grep -q "Background" PERFORMANCE.md; then
    echo "  ✅ PERFORMANCE.md has required sections"
else
    echo "  ❌ PERFORMANCE.md missing required sections"
    ((errors++))
fi

# Check DEPLOYMENT.md sections
if grep -q "Docker" DEPLOYMENT.md && \
   grep -q "Kubernetes" DEPLOYMENT.md && \
   grep -q "Monitoring" DEPLOYMENT.md; then
    echo "  ✅ DEPLOYMENT.md has required sections"
else
    echo "  ❌ DEPLOYMENT.md missing required sections"
    ((errors++))
fi

echo ""
echo "Checking code features..."

# Check for caching implementation
if grep -q "CacheManager" backend/app/cache.py && \
   grep -q "xxhash" backend/app/cache.py; then
    echo "  ✅ Caching with xxhash implemented"
else
    echo "  ❌ Caching implementation incomplete"
    ((errors++))
fi

# Check for streaming
if grep -q "vectorize_streaming" backend/app/vectorizer.py && \
   grep -q "AsyncGenerator" backend/app/vectorizer.py; then
    echo "  ✅ Streaming response implemented"
else
    echo "  ❌ Streaming response incomplete"
    ((errors++))
fi

# Check for background tasks
if grep -q "BackgroundTaskManager" backend/app/tasks.py && \
   grep -q "submit_vectorization_task" backend/app/tasks.py; then
    echo "  ✅ Background task processing implemented"
else
    echo "  ❌ Background task processing incomplete"
    ((errors++))
fi

# Check for chunked uploads
if grep -q "/upload/chunked" backend/app/main.py; then
    echo "  ✅ Chunked uploads implemented"
else
    echo "  ❌ Chunked uploads incomplete"
    ((errors++))
fi

# Check E2E tests
if [ -f "tests/e2e/upload-workflow.spec.ts" ] && \
   [ -f "tests/e2e/svg-quality.spec.ts" ]; then
    echo "  ✅ E2E tests present"
else
    echo "  ❌ E2E tests missing"
    ((errors++))
fi

echo ""
echo "Checking monitoring..."

# Check Prometheus integration
if grep -q "prometheus_client" backend/app/main.py && \
   grep -q "/metrics" backend/app/main.py; then
    echo "  ✅ Prometheus metrics implemented"
else
    echo "  ❌ Prometheus metrics incomplete"
    ((errors++))
fi

echo ""
echo "================================"
if [ $errors -eq 0 ]; then
    echo "✅ Validation passed! All requirements met."
    echo ""
    echo "Next steps:"
    echo "  1. Generate test fixtures: cd tests/fixtures && python3 generate_fixtures.py"
    echo "  2. Start services: docker-compose up -d"
    echo "  3. Run tests: make test"
    exit 0
else
    echo "❌ Validation failed with $errors error(s)"
    exit 1
fi
