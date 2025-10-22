# Testing Guide

This document outlines the testing strategy, how to run tests, and testing best practices for the Image to SVG Converter service.

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Unit Tests](#unit-tests)
3. [End-to-End Tests](#end-to-end-tests)
4. [Performance Tests](#performance-tests)
5. [Test Coverage](#test-coverage)
6. [CI/CD Integration](#cicd-integration)

## Testing Strategy

The project uses a multi-layered testing approach:

```
┌─────────────────────────────────────┐
│     E2E Tests (Playwright)          │  ← User workflows, SVG quality
├─────────────────────────────────────┤
│     Integration Tests               │  ← API endpoints, caching
├─────────────────────────────────────┤
│     Unit Tests (pytest)             │  ← Individual components
└─────────────────────────────────────┘
```

### Test Pyramid

- **Unit Tests**: 70% - Fast, isolated, testing individual functions
- **Integration Tests**: 20% - Testing component interactions
- **E2E Tests**: 10% - Testing complete user workflows

## Unit Tests

### Running Unit Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_cache.py

# Run specific test
pytest tests/test_cache.py::test_cache_manager_initialization

# Run with verbose output
pytest -v

# Run in parallel
pytest -n auto
```

### Test Structure

```
backend/tests/
├── __init__.py
├── test_api.py           # API endpoint tests
├── test_cache.py         # Cache functionality tests
├── test_preprocessing.py # Image preprocessing tests
├── test_vectorizer.py    # SVG generation tests
└── test_tasks.py         # Background task tests
```

### Writing Unit Tests

Example unit test:

```python
import pytest
from app.cache import CacheManager

@pytest.fixture
def cache_manager():
    return CacheManager()

@pytest.mark.asyncio
async def test_cache_key_generation(cache_manager):
    """Test that cache keys are generated consistently"""
    image_data = b"test data"
    params = {"resize": True}
    
    key1 = cache_manager.generate_cache_key(image_data, params)
    key2 = cache_manager.generate_cache_key(image_data, params)
    
    assert key1 == key2
    assert key1.startswith("svg:")
```

### Test Fixtures

Common fixtures are defined in `conftest.py`:

```python
@pytest.fixture
def sample_image():
    """Generate a test image"""
    from PIL import Image
    import io
    
    img = Image.new('RGB', (100, 100), color='white')
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return buffer.getvalue()
```

## End-to-End Tests

### Running E2E Tests

```bash
cd tests

# Install dependencies (first time only)
npm install

# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npm test

# Run in headed mode (see browser)
npm run test:headed

# Run specific test file
npx playwright test e2e/upload-workflow.spec.ts

# Run with UI mode
npm run test:ui

# Debug tests
npm run test:debug

# Generate report
npm run report
```

### Test Structure

```
tests/
├── e2e/
│   ├── upload-workflow.spec.ts  # Upload and conversion tests
│   └── svg-quality.spec.ts      # SVG quality regression tests
├── fixtures/
│   ├── test-image.png
│   ├── large-image.png
│   └── generate_fixtures.py
├── playwright.config.ts
└── package.json
```

### E2E Test Coverage

#### Upload Workflow Tests (`upload-workflow.spec.ts`)

- ✅ Display upload interface
- ✅ Enable convert button after file selection
- ✅ Successfully convert image to SVG
- ✅ Display processing time
- ✅ Download SVG file
- ✅ Different conversion options
- ✅ Streaming mode
- ✅ Background processing
- ✅ Error handling
- ✅ Cache usage on repeated conversions

#### SVG Quality Tests (`svg-quality.spec.ts`)

- ✅ Valid SVG structure
- ✅ Contains vector elements
- ✅ Correct dimensions and aspect ratio
- ✅ Binary mode produces black/white output
- ✅ Grayscale mode produces varying tones
- ✅ Simplification reduces element count
- ✅ Valid XML format
- ✅ Large images process without timeout
- ✅ Visual similarity to original
- ✅ Consistent output for repeated conversions

### Writing E2E Tests

Example E2E test:

```typescript
import { test, expect } from '@playwright/test';
import * as path from 'path';

test('should convert image and allow download', async ({ page }) => {
  await page.goto('/');
  
  // Upload file
  const fileInput = page.locator('#file-input');
  await fileInput.setInputFiles(
    path.join(__dirname, '../fixtures/test-image.png')
  );
  
  // Convert
  await page.locator('.convert-button').click();
  
  // Wait for result
  await expect(page.locator('svg')).toBeVisible({ timeout: 30000 });
  
  // Download
  const downloadPromise = page.waitForEvent('download');
  await page.locator('.download-button').click();
  const download = await downloadPromise;
  
  expect(download.suggestedFilename()).toMatch(/\.svg$/);
});
```

### Test Fixtures

Generate test fixtures:

```bash
cd tests/fixtures
pip install pillow
python3 generate_fixtures.py
```

Or manually create:

```python
from PIL import Image, ImageDraw

# Small test image
img = Image.new('RGB', (100, 100), color='white')
draw = ImageDraw.Draw(img)
draw.rectangle([20, 20, 80, 80], fill='black')
img.save('test-image.png')

# Large test image
large = Image.new('RGB', (800, 600), color='white')
draw = ImageDraw.Draw(large)
for i in range(0, 800, 50):
    draw.line([(i, 0), (i, 600)], fill='black', width=2)
large.save('large-image.png')
```

## Performance Tests

### Load Testing with Locust

Create `tests/performance/locustfile.py`:

```python
from locust import HttpUser, task, between
import random

class ImageConverterUser(HttpUser):
    wait_time = between(1, 3)
    
    @task(3)
    def convert_small_image(self):
        with open('fixtures/test-image.png', 'rb') as f:
            files = {'file': f}
            self.client.post('/convert', files=files)
    
    @task(1)
    def convert_large_image(self):
        with open('fixtures/large-image.png', 'rb') as f:
            files = {'file': f}
            self.client.post('/convert/streaming', files=files)
    
    @task(1)
    def health_check(self):
        self.client.get('/health')
```

Run load tests:

```bash
pip install locust
locust -f tests/performance/locustfile.py --host http://localhost:8000
```

### Benchmark Tests

```python
import pytest
import time

@pytest.mark.benchmark
def test_vectorization_performance(benchmark, sample_image):
    from app.vectorizer import vectorizer
    
    result = benchmark(vectorizer.vectorize, sample_image)
    
    assert result is not None
```

Run benchmarks:

```bash
pytest tests/ -m benchmark --benchmark-only
```

## Test Coverage

### Generate Coverage Report

```bash
cd backend

# Run tests with coverage
pytest --cov=app --cov-report=html --cov-report=term

# Open HTML report
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
start htmlcov/index.html  # Windows
```

### Coverage Goals

- **Overall Coverage**: > 80%
- **Critical Paths**: > 90%
  - Cache operations
  - Image preprocessing
  - SVG generation
  - API endpoints

### Coverage Report Example

```
Name                      Stmts   Miss  Cover
---------------------------------------------
app/__init__.py               0      0   100%
app/cache.py                 87      5    94%
app/config.py                15      0   100%
app/main.py                 156     12    92%
app/preprocessing.py         94      8    91%
app/tasks.py                 78     10    87%
app/vectorizer.py           112     15    87%
---------------------------------------------
TOTAL                       542     50    91%
```

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
    
    - name: Run unit tests
      run: |
        cd backend
        pytest --cov=app --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./backend/coverage.xml

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Start services
      run: docker-compose up -d
    
    - name: Wait for services
      run: |
        timeout 60 sh -c 'until curl -f http://localhost:8000/health; do sleep 2; done'
    
    - name: Install Playwright
      run: |
        cd tests
        npm ci
        npx playwright install --with-deps
    
    - name: Run E2E tests
      run: |
        cd tests
        npm test
    
    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: playwright-report
        path: tests/playwright-report/
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - e2e

unit-tests:
  stage: test
  image: python:3.11
  services:
    - redis:7-alpine
  script:
    - cd backend
    - pip install -r requirements.txt
    - pytest --cov=app --cov-report=term
  coverage: '/TOTAL.*\s+(\d+%)$/'

e2e-tests:
  stage: e2e
  image: mcr.microsoft.com/playwright:v1.40.0
  services:
    - redis:7-alpine
  script:
    - docker-compose up -d
    - cd tests
    - npm ci
    - npm test
  artifacts:
    when: always
    paths:
      - tests/playwright-report/
```

## Test Best Practices

### 1. Test Naming

Use descriptive test names:

```python
# Good
def test_cache_returns_none_when_key_not_found():
    ...

# Bad
def test_cache():
    ...
```

### 2. Test Independence

Each test should be independent:

```python
# Good - uses fixtures
@pytest.fixture
def cache():
    cache = CacheManager()
    yield cache
    cache.clear()

def test_a(cache):
    cache.set('key', 'value')
    assert cache.get('key') == 'value'

def test_b(cache):
    # Doesn't depend on test_a
    assert cache.get('nonexistent') is None
```

### 3. Arrange-Act-Assert

Structure tests clearly:

```python
def test_image_preprocessing():
    # Arrange
    preprocessor = ImagePreprocessor()
    image_data = create_test_image()
    
    # Act
    result, metadata = await preprocessor.preprocess(image_data)
    
    # Assert
    assert result is not None
    assert metadata['original_size'] == (100, 100)
```

### 4. Use Fixtures

Reuse common setup:

```python
@pytest.fixture
def api_client():
    return TestClient(app)

@pytest.fixture
def sample_image():
    return create_test_image()

def test_upload(api_client, sample_image):
    response = api_client.post('/convert', files={'file': sample_image})
    assert response.status_code == 200
```

### 5. Mock External Dependencies

```python
@pytest.fixture
def mock_redis(monkeypatch):
    class MockRedis:
        async def get(self, key):
            return None
        
        async def set(self, key, value):
            pass
    
    monkeypatch.setattr('app.cache.redis', MockRedis())
```

## Continuous Testing

### Watch Mode

Run tests automatically on file changes:

```bash
# Backend
pytest-watch

# Frontend
npm run test:watch
```

### Pre-commit Hooks

Create `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: local
    hooks:
      - id: pytest
        name: pytest
        entry: pytest
        language: system
        pass_filenames: false
        always_run: true
        args: [--exitfirst]
```

Install:

```bash
pip install pre-commit
pre-commit install
```

## Debugging Tests

### Pytest Debugging

```bash
# Stop on first failure
pytest -x

# Show print statements
pytest -s

# Debug with pdb
pytest --pdb

# Run last failed tests
pytest --lf
```

### Playwright Debugging

```bash
# Debug mode
npx playwright test --debug

# Record trace
npx playwright test --trace on

# Show trace
npx playwright show-trace trace.zip
```

## Summary

The testing strategy ensures:

- ✅ Comprehensive coverage of all features
- ✅ Automated regression testing for SVG quality
- ✅ Performance profiling and benchmarking
- ✅ CI/CD integration for continuous testing
- ✅ Clear documentation for writing and running tests

For more information, see:
- [README.md](README.md) - General documentation
- [PERFORMANCE.md](PERFORMANCE.md) - Performance guidelines
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
