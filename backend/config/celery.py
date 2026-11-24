import logging
import os

from celery import Celery

from metrics import celery_exporter

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

celery = Celery("config")
default_config = "config.celeryconfig"
celery.config_from_object(default_config)

logger = logging.getLogger("celery")
logger.info("Initializing Celery application")

celery.autodiscover_tasks()

logger.info("Celery tasks discovered")

celery_exporter.connect()
