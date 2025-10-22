import numpy as np
from typing import Optional, AsyncGenerator
import logging
import time
import xml.etree.ElementTree as ET
from io import StringIO

logger = logging.getLogger(__name__)


class SVGVectorizer:
    """Converts preprocessed images to SVG format with streaming support"""
    
    def __init__(self):
        self.chunk_size = 8192
    
    async def vectorize(
        self,
        image_array: np.ndarray,
        color_mode: str = 'binary',
        simplify: bool = True
    ) -> str:
        """
        Convert image array to SVG
        
        Args:
            image_array: Preprocessed image as numpy array
            color_mode: 'binary' or 'grayscale'
            simplify: Whether to simplify paths
            
        Returns:
            SVG string
        """
        start_time = time.time()
        
        try:
            height, width = image_array.shape
            logger.info(f"Vectorizing {width}x{height} image")
            
            svg_data = self._create_svg_from_array(
                image_array, 
                width, 
                height,
                color_mode,
                simplify
            )
            
            processing_time = (time.time() - start_time) * 1000
            logger.info(f"Vectorization completed in {processing_time:.2f}ms")
            
            svg_data = svg_data.replace(
                '<svg',
                f'<svg data-processing-time="{processing_time:.2f}ms"',
                1
            )
            
            return svg_data
            
        except Exception as e:
            logger.error(f"Vectorization error: {e}")
            raise
    
    async def vectorize_streaming(
        self,
        image_array: np.ndarray,
        color_mode: str = 'binary',
        simplify: bool = True
    ) -> AsyncGenerator[str, None]:
        """
        Stream SVG generation for large images
        
        Yields SVG chunks as they're generated
        """
        height, width = image_array.shape
        logger.info(f"Streaming vectorization for {width}x{height} image")
        
        yield f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">\n'
        
        chunk_height = max(1, height // 10)
        
        for y_start in range(0, height, chunk_height):
            y_end = min(y_start + chunk_height, height)
            chunk = image_array[y_start:y_end, :]
            
            paths = self._generate_paths_for_chunk(
                chunk, 
                y_start,
                color_mode,
                simplify
            )
            
            for path in paths:
                yield path + '\n'
            
            await self._yield_control()
        
        yield '</svg>'
    
    def _create_svg_from_array(
        self,
        image_array: np.ndarray,
        width: int,
        height: int,
        color_mode: str,
        simplify: bool
    ) -> str:
        """Create complete SVG from image array"""
        svg_parts = [
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">'
        ]
        
        if color_mode == 'binary':
            paths = self._generate_binary_paths(image_array, simplify)
        else:
            paths = self._generate_grayscale_paths(image_array, simplify)
        
        svg_parts.extend(paths)
        svg_parts.append('</svg>')
        
        return '\n'.join(svg_parts)
    
    def _generate_binary_paths(self, image_array: np.ndarray, simplify: bool) -> list:
        """Generate SVG paths for binary image"""
        paths = []
        threshold = 128
        binary = image_array < threshold
        
        height, width = binary.shape
        visited = np.zeros_like(binary, dtype=bool)
        
        for y in range(height):
            x = 0
            while x < width:
                if binary[y, x] and not visited[y, x]:
                    x_start = x
                    while x < width and binary[y, x] and not visited[y, x]:
                        visited[y, x] = True
                        x += 1
                    x_end = x
                    
                    if simplify and x_end - x_start > 1:
                        paths.append(
                            f'<rect x="{x_start}" y="{y}" width="{x_end - x_start}" height="1" fill="black"/>'
                        )
                    else:
                        for xi in range(x_start, x_end):
                            paths.append(
                                f'<rect x="{xi}" y="{y}" width="1" height="1" fill="black"/>'
                            )
                else:
                    x += 1
        
        return paths
    
    def _generate_grayscale_paths(self, image_array: np.ndarray, simplify: bool) -> list:
        """Generate SVG paths for grayscale image"""
        paths = []
        height, width = image_array.shape
        
        step = 2 if simplify else 1
        
        for y in range(0, height, step):
            for x in range(0, width, step):
                gray_value = int(image_array[y, x])
                color = f'rgb({gray_value},{gray_value},{gray_value})'
                size = step
                paths.append(
                    f'<rect x="{x}" y="{y}" width="{size}" height="{size}" fill="{color}"/>'
                )
        
        return paths
    
    def _generate_paths_for_chunk(
        self,
        chunk: np.ndarray,
        y_offset: int,
        color_mode: str,
        simplify: bool
    ) -> list:
        """Generate SVG paths for a chunk of the image"""
        paths = []
        threshold = 128
        binary = chunk < threshold
        
        height, width = binary.shape
        
        for y in range(height):
            x = 0
            while x < width:
                if binary[y, x]:
                    x_start = x
                    while x < width and binary[y, x]:
                        x += 1
                    x_end = x
                    
                    actual_y = y_offset + y
                    
                    if simplify and x_end - x_start > 1:
                        paths.append(
                            f'<rect x="{x_start}" y="{actual_y}" width="{x_end - x_start}" height="1" fill="black"/>'
                        )
                else:
                    x += 1
        
        return paths
    
    async def _yield_control(self):
        """Allow other tasks to run"""
        import asyncio
        await asyncio.sleep(0)
    
    def validate_svg(self, svg_data: str) -> bool:
        """Validate SVG structure"""
        try:
            ET.fromstring(svg_data)
            return True
        except ET.ParseError as e:
            logger.error(f"SVG validation error: {e}")
            return False


vectorizer = SVGVectorizer()
