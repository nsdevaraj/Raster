from typing import Optional
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from .preprocessing import preprocessor
from .vectorizer import vectorizer
from .cache import cache_manager
from .config import settings

logger = logging.getLogger(__name__)

executor = ThreadPoolExecutor(max_workers=settings.worker_pool_size)


class BackgroundTaskManager:
    """Manages background processing tasks without blocking the main thread"""
    
    def __init__(self):
        self.pending_tasks = {}
        self.completed_tasks = {}
    
    async def submit_vectorization_task(
        self,
        task_id: str,
        image_data: bytes,
        params: dict
    ) -> str:
        """Submit a vectorization task to run in the background"""
        logger.info(f"Submitting background task: {task_id}")
        
        self.pending_tasks[task_id] = {
            'status': 'pending',
            'progress': 0
        }
        
        asyncio.create_task(self._process_task(task_id, image_data, params))
        
        return task_id
    
    async def _process_task(self, task_id: str, image_data: bytes, params: dict):
        """Process vectorization task in background"""
        try:
            self.pending_tasks[task_id]['status'] = 'processing'
            self.pending_tasks[task_id]['progress'] = 10
            
            cache_key = cache_manager.generate_cache_key(image_data, params)
            cached_result = await cache_manager.get(cache_key)
            
            if cached_result:
                logger.info(f"Task {task_id} served from cache")
                self.completed_tasks[task_id] = {
                    'status': 'completed',
                    'result': cached_result.decode('utf-8'),
                    'from_cache': True
                }
                if task_id in self.pending_tasks:
                    del self.pending_tasks[task_id]
                return
            
            self.pending_tasks[task_id]['progress'] = 30
            
            image_array, metadata = await preprocessor.preprocess(
                image_data,
                resize=params.get('resize', True),
                enhance=params.get('enhance', False),
                threshold=params.get('threshold')
            )
            
            self.pending_tasks[task_id]['progress'] = 60
            
            svg_result = await vectorizer.vectorize(
                image_array,
                color_mode=params.get('color_mode', 'binary'),
                simplify=params.get('simplify', True)
            )
            
            self.pending_tasks[task_id]['progress'] = 90
            
            await cache_manager.set(cache_key, svg_result.encode('utf-8'))
            
            self.completed_tasks[task_id] = {
                'status': 'completed',
                'result': svg_result,
                'metadata': metadata,
                'from_cache': False
            }
            
            if task_id in self.pending_tasks:
                del self.pending_tasks[task_id]
            
            logger.info(f"Task {task_id} completed successfully")
            
        except Exception as e:
            logger.error(f"Task {task_id} failed: {e}")
            self.completed_tasks[task_id] = {
                'status': 'failed',
                'error': str(e)
            }
            if task_id in self.pending_tasks:
                del self.pending_tasks[task_id]
    
    def get_task_status(self, task_id: str) -> Optional[dict]:
        """Get the status of a task"""
        if task_id in self.pending_tasks:
            return self.pending_tasks[task_id]
        elif task_id in self.completed_tasks:
            return self.completed_tasks[task_id]
        return None
    
    def cleanup_completed_tasks(self, max_age_seconds: int = 3600):
        """Clean up old completed tasks"""
        import time
        current_time = time.time()
        
        to_remove = []
        for task_id, task_data in self.completed_tasks.items():
            if 'completed_at' in task_data:
                age = current_time - task_data['completed_at']
                if age > max_age_seconds:
                    to_remove.append(task_id)
        
        for task_id in to_remove:
            del self.completed_tasks[task_id]
            logger.info(f"Cleaned up old task: {task_id}")


task_manager = BackgroundTaskManager()
