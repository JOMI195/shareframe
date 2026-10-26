import os

from celery.schedules import crontab, timedelta

broker_host = os.environ.get("REDIS_HOST")
broker_port = os.environ.get("REDIS_PORT")
broker_db = os.environ.get("REDIS_DB")

broker_url = f"redis://{broker_host}:{broker_port}/{broker_db}"

broker_connection_max_retries = None
broker_connection_retry = True
broker_connection_retry_on_startup = True

result_backend = "django-db"
result_extended = True
# The root logger stays as Django configured it.
worker_hijack_root_logger = False

timezone = "Europe/Berlin"

# config is no Django app, so autodiscover_tasks() misses it
imports = ("config.tasks",)

beat_schedule = {
    "delete-inactive-users-every-24-hours": {
        "task": "user_core.tasks.delete_inactive_users",
        "schedule": crontab(minute=0, hour=2),  # Runs daily at 2 in the morning
    },
    "reject-long-pending-friendship-requestes-every-24-hours": {
        "task": "friendships.tasks.reject_long_pending_friendship_requestes",
        "schedule": crontab(minute=0, hour=2),
    },
    "delete-long-expired-sent-images-every-24-hours": {
        "task": "sent_images.tasks.delete_long_expired_sent_images",
        "schedule": crontab(minute=0, hour=2),
    },
    # runs some time after deleting expired SentImages
    "delete-marked-as-deleted-images-without-sent-images-every-24-hours": {
        "task": "images.tasks.delete_marked_as_deleted_images_without_sent_images",
        "schedule": crontab(minute=30, hour=2),
    },
    "mark_expired_images_to_be_deleted": {
        "task": "images.tasks.mark_expired_images_to_be_deleted",
        "schedule": timedelta(minutes=15),
    },
    "deliver-due-scheduled-sent-images-every-minute": {
        "task": "sent_images.tasks.deliver_due_scheduled_sent_images",
        "schedule": timedelta(minutes=1),
    },
    "flush-expired-tokens-every-24-hours": {
        "task": "authentication.tasks.flush_expired_tokens",
        "schedule": crontab(minute=0, hour=3),
    },
    "close-and-delete-long-inactive-frame-websocket-connections-every-15-minutes": {
        "task": "frames.tasks.close_and_delete_long_inactive_frame_websocket_connections",
        "schedule": timedelta(minutes=15),
    },
    "expire-unanswered-frame-commands-every-minute": {
        "task": "frames.tasks.expire_unanswered_frame_commands",
        "schedule": timedelta(minutes=1),
    },
    "delete-old-frame-diagnostics-every-24-hours": {
        "task": "frames.tasks.delete_old_frame_diagnostics",
        "schedule": crontab(minute=0, hour=4),
    },
    "send-inactivity-reminders-every-24-hours": {
        "task": "notifications.tasks.send_inactivity_reminders",
        "schedule": crontab(minute=0, hour=18),
    },
    "delete-old-server-logs-every-15-minutes": {
        "task": "config.tasks.delete_old_server_logs",
        "schedule": timedelta(minutes=15),
    },
}
