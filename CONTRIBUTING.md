# Contributing to Image2SVG

Thank you for your interest in contributing to the Image to SVG Converter project! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/image2svg.git
cd image2svg

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/image2svg.git
```

### 2. Set Up Development Environment

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install

# Start Redis for development
docker run -d -p 6379:6379 redis:7-alpine
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

## Development Workflow

### Making Changes

1. **Write Code**: Implement your feature or fix
2. **Write Tests**: Add unit and/or E2E tests
3. **Run Tests**: Ensure all tests pass
4. **Update Docs**: Update relevant documentation

### Running Tests

```bash
# Backend unit tests
cd backend
pytest

# Frontend E2E tests
cd tests
npm test

# Check coverage
cd backend
pytest --cov=app --cov-report=html
```

### Code Style

#### Python (Backend)

Follow PEP 8:

```bash
# Format code
black app/

# Check style
flake8 app/

# Type checking
mypy app/
```

#### TypeScript (Frontend)

```bash
# Format code
npm run format

# Lint
npm run lint
```

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add streaming support for large images
fix: resolve cache key collision issue
docs: update deployment guide
test: add E2E tests for background processing
perf: optimize image preprocessing pipeline
```

Format: `<type>: <description>`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `perf`: Performance improvement
- `refactor`: Code refactoring
- `style`: Code style changes
- `chore`: Maintenance tasks

## Submitting Changes

### 1. Update Your Branch

```bash
git fetch upstream
git rebase upstream/main
```

### 2. Push Changes

```bash
git push origin feature/your-feature-name
```

### 3. Create Pull Request

1. Go to GitHub and create a Pull Request
2. Fill out the PR template
3. Link any related issues
4. Wait for review

### PR Checklist

- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Commit messages are clear
- [ ] No merge conflicts
- [ ] PR description is complete

## Testing Guidelines

### Unit Tests

```python
import pytest

@pytest.mark.asyncio
async def test_feature():
    """Test description"""
    # Arrange
    setup_data = create_test_data()
    
    # Act
    result = await function_under_test(setup_data)
    
    # Assert
    assert result.is_valid()
```

### E2E Tests

```typescript
test('should complete user workflow', async ({ page }) => {
  // Navigate
  await page.goto('/');
  
  // Interact
  await page.click('.action-button');
  
  // Assert
  await expect(page.locator('.result')).toBeVisible();
});
```

## Documentation

### Code Comments

```python
def process_image(image_data: bytes, params: dict) -> str:
    """
    Process image and convert to SVG.
    
    Args:
        image_data: Raw image bytes
        params: Processing parameters
            - resize (bool): Whether to resize
            - enhance (bool): Whether to enhance
    
    Returns:
        SVG string
    
    Raises:
        ValueError: If image_data is invalid
    """
    pass
```

### Documentation Updates

Update relevant docs when:
- Adding new features
- Changing APIs
- Modifying configuration
- Improving performance

## Performance Considerations

### Profiling

```python
import cProfile
import pstats

profiler = cProfile.Profile()
profiler.enable()

# Your code here

profiler.disable()
stats = pstats.Stats(profiler)
stats.sort_stats('cumulative')
stats.print_stats(10)
```

### Benchmarking

```python
@pytest.mark.benchmark
def test_performance(benchmark):
    result = benchmark(function_to_test, args)
    assert result is not None
```

## Architecture Guidelines

### Backend Structure

```
backend/app/
├── __init__.py
├── main.py          # FastAPI app
├── config.py        # Configuration
├── cache.py         # Cache logic
├── preprocessing.py # Image processing
├── vectorizer.py    # SVG generation
└── tasks.py         # Background tasks
```

### Frontend Structure

```
frontend/src/
├── main.tsx         # Entry point
├── App.tsx          # Main component
├── App.css          # Styles
└── components/      # React components
```

## Debugging

### Backend Debugging

```bash
# Run with debugger
python -m pdb -m uvicorn app.main:app

# Or use IDE debugger with launch.json
```

### Frontend Debugging

```bash
# React DevTools
npm run dev

# Browser DevTools
```

### Test Debugging

```bash
# Pytest with debugger
pytest --pdb

# Playwright with UI
npx playwright test --ui
```

## Release Process

### Version Numbering

Follow Semantic Versioning:
- MAJOR.MINOR.PATCH
- Example: 1.2.3

### Creating a Release

1. Update version numbers
2. Update CHANGELOG.md
3. Create git tag
4. Push to GitHub
5. Create GitHub release

## Getting Help

- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions
- **Documentation**: Check README.md, PERFORMANCE.md, DEPLOYMENT.md

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- GitHub contributors page

Thank you for contributing to Image2SVG! 🎉
