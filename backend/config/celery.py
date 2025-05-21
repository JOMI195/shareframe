import os
import logging
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

celery = Celery("config")
default_config = "config.celeryconfig"
celery.config_from_object(default_config)

logger = logging.getLogger("celery")
logger.info("Initializing Celery application")

celery.autodiscover_tasks()

logger.info("Celery tasks discovered")
