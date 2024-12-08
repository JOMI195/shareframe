import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

celery = Celery("config")
default_config = "config.celeryconfig"
celery.config_from_object(default_config)
celery.autodiscover_tasks()
