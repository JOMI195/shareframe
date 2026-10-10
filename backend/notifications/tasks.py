from config.celery import celery

from .triggers import inactivity


@celery.task
def send_inactivity_reminders():
    return inactivity.send_reminders()
