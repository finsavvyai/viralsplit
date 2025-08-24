from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv()

# Create Celery application
celery_app = Celery(
    'tasks',
    broker=os.getenv('REDIS_URL', 'redis://localhost:6379'),
    backend=os.getenv('REDIS_URL', 'redis://localhost:6379'),
    include=['main']
)

# Configure celery
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_routes={
        'main.transform_video_task': {'queue': 'video_processing'}
    }
)

if __name__ == '__main__':
    celery_app.start()