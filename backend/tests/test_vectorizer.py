import pytest
import numpy as np
from app.vectorizer import SVGVectorizer


@pytest.fixture
def vectorizer():
    return SVGVectorizer()


@pytest.fixture
def sample_image_array():
    """Create a sample numpy array for testing"""
    array = np.ones((50, 50), dtype=np.uint8) * 255
    array[10:40, 10:40] = 0
    return array


@pytest.mark.asyncio
async def test_vectorize_basic(vectorizer, sample_image_array):
    """Test basic vectorization"""
    result = await vectorizer.vectorize(sample_image_array)
    
    assert isinstance(result, str)
    assert result.startswith('<svg')
    assert result.endswith('</svg>')
    assert 'xmlns="http://www.w3.org/2000/svg"' in result


@pytest.mark.asyncio
async def test_vectorize_binary_mode(vectorizer, sample_image_array):
    """Test vectorization in binary mode"""
    result = await vectorizer.vectorize(sample_image_array, color_mode='binary')
    
    assert 'fill="black"' in result or 'fill="#000"' in result


@pytest.mark.asyncio
async def test_vectorize_grayscale_mode(vectorizer, sample_image_array):
    """Test vectorization in grayscale mode"""
    result = await vectorizer.vectorize(sample_image_array, color_mode='grayscale')
    
    assert 'rgb(' in result


@pytest.mark.asyncio
async def test_validate_svg(vectorizer, sample_image_array):
    """Test SVG validation"""
    svg_result = await vectorizer.vectorize(sample_image_array)
    
    is_valid = vectorizer.validate_svg(svg_result)
    assert is_valid is True


@pytest.mark.asyncio
async def test_streaming_vectorization(vectorizer, sample_image_array):
    """Test streaming vectorization"""
    chunks = []
    async for chunk in vectorizer.vectorize_streaming(sample_image_array):
        chunks.append(chunk)
    
    assert len(chunks) > 0
    result = ''.join(chunks)
    assert result.startswith('<svg')
    assert result.endswith('</svg>')
