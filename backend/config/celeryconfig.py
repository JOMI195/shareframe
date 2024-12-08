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

timezone = "Europe/Berlin"

beat_schedule = {
    "delete-inactive-users-every-24-hours": {
        "task": "user_core.tasks.delete_inactive_users",
        "schedule": crontab(minute=0, hour=0),  # Runs daily at midnight
    },
}

# Check for production environment
# PRODUCTION = os.environ.get("PRODUCTION", False) == "True"
# if PRODUCTION:
#     beat_schedule["joke-of-the-day-full-workflow"] = {
#         "task": "workflows.tasks.joke_of_the_day_full_workflow",
#         "schedule": crontab(hour=5, minute=0),  # Runs daily at 5 AM
#     }
