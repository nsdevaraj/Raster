import pytest
import numpy as np
from PIL import Image
import io
from app.preprocessing import ImagePreprocessor


@pytest.fixture
def preprocessor():
    return ImagePreprocessor()


@pytest.fixture
def sample_image_data():
    """Create a sample image for testing"""
    img = Image.new('RGB', (100, 100), color='white')
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return buffer.getvalue()


@pytest.mark.asyncio
async def test_preprocess_basic(preprocessor, sample_image_data):
    """Test basic preprocessing"""
    result, metadata = await preprocessor.preprocess(sample_image_data)
    
    assert isinstance(result, np.ndarray)
    assert 'original_size' in metadata
    assert 'total_time_ms' in metadata
    assert metadata['original_size'] == (100, 100)


@pytest.mark.asyncio
async def test_preprocess_with_resize(preprocessor):
    """Test preprocessing with resize"""
    large_img = Image.new('RGB', (5000, 5000), color='white')
    buffer = io.BytesIO()
    large_img.save(buffer, format='PNG')
    image_data = buffer.getvalue()
    
    result, metadata = await preprocessor.preprocess(image_data, resize=True)
    
    assert 'resized' in metadata
    assert metadata['resized'] is True
    assert max(metadata['new_size']) <= preprocessor.max_dimension


@pytest.mark.asyncio
async def test_estimate_processing_time(preprocessor):
    """Test processing time estimation"""
    time_estimate = await preprocessor.estimate_processing_time((1000, 1000))
    assert time_estimate > 0
    assert isinstance(time_estimate, float)
