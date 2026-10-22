import logging
from datetime import timedelta

from config.celery import celery

from .server_logs import delete_server_logs

logger = logging.getLogger("celery")


@celery.task
def delete_old_server_logs():
    count = delete_server_logs(older_than=timedelta(minutes=15))
    if count:
        logger.info(f"Deleted {count} server log archive(s)")
    return f"Deleted {count} server log archives."
