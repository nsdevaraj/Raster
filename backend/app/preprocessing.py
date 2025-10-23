import io
from PIL import Image
import numpy as np
from typing import Tuple, Optional
import logging
from .config import settings

logger = logging.getLogger(__name__)


class ImagePreprocessor:
    """Handles image preprocessing with performance optimizations"""
    
    def __init__(self):
        self.max_dimension = settings.max_image_dimension
        self.quality = settings.compression_quality
    
    async def preprocess(
        self, 
        image_data: bytes,
        resize: bool = True,
        enhance: bool = False,
        threshold: Optional[int] = None
    ) -> Tuple[np.ndarray, dict]:
        """
        Preprocess image for vectorization with performance profiling
        
        Args:
            image_data: Raw image bytes
            resize: Whether to resize large images
            enhance: Whether to enhance image quality
            threshold: Binary threshold value (None for auto)
            
        Returns:
            Processed image as numpy array and metadata dict
        """
        import time
        start_time = time.time()
        metadata = {}
        
        try:
            img = Image.open(io.BytesIO(image_data))
            original_size = img.size
            metadata['original_size'] = original_size
            metadata['original_mode'] = img.mode
            
            logger.info(f"Processing image: {original_size} {img.mode}")
            
            if img.mode == 'RGBA':
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[3])
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            if resize and (img.width > self.max_dimension or img.height > self.max_dimension):
                resize_start = time.time()
                ratio = min(self.max_dimension / img.width, self.max_dimension / img.height)
                new_size = (int(img.width * ratio), int(img.height * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
                metadata['resized'] = True
                metadata['new_size'] = new_size
                metadata['resize_time_ms'] = (time.time() - resize_start) * 1000
                logger.info(f"Resized to: {new_size}")
            
            if enhance:
                enhance_start = time.time()
                img = self._enhance_image(img)
                metadata['enhance_time_ms'] = (time.time() - enhance_start) * 1000
            
            grayscale = img.convert('L')
            
            if threshold is not None:
                threshold_start = time.time()
                img_array = np.array(grayscale)
                img_array = (img_array > threshold).astype(np.uint8) * 255
                metadata['threshold_time_ms'] = (time.time() - threshold_start) * 1000
                metadata['threshold_value'] = threshold
            else:
                img_array = np.array(grayscale)
            
            metadata['final_size'] = img_array.shape
            metadata['total_time_ms'] = (time.time() - start_time) * 1000
            
            logger.info(f"Preprocessing completed in {metadata['total_time_ms']:.2f}ms")
            
            return img_array, metadata
            
        except Exception as e:
            logger.error(f"Preprocessing error: {e}")
            raise
    
    def _enhance_image(self, img: Image.Image) -> Image.Image:
        """Apply image enhancement"""
        from PIL import ImageEnhance
        
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.2)
        
        enhancer = ImageEnhance.Sharpness(img)
        img = enhancer.enhance(1.1)
        
        return img
    
    async def estimate_processing_time(self, image_size: Tuple[int, int]) -> float:
        """Estimate processing time based on image size"""
        pixels = image_size[0] * image_size[1]
        base_time = 0.1
        pixel_factor = pixels / (1000 * 1000)
        estimated_seconds = base_time + (pixel_factor * 0.5)
        return estimated_seconds


preprocessor = ImagePreprocessor()
