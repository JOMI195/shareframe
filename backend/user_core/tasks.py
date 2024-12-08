from config.celery import celery
from django.utils import timezone
from datetime import timedelta
from .models import User


@celery.task
def delete_inactive_users():
    """Delete users who haven't activated their account within 24 hours."""
    time_threshold = timezone.now() - timedelta(hours=24)
    inactive_users = User.objects.filter(
        is_active=False, is_deleted=False, date_joined__lt=time_threshold
    )
    count = inactive_users.count()
    inactive_users.delete()
    return f"Deleted {count} inactive users."
