from config.celery import celery
from django.utils import timezone
from datetime import timedelta
from .models import Friendship


@celery.task
def reject_long_pending_friendship_requestes():
    """Reject friendship requests who haven't accepted their requests within 30 days."""
    now = timezone.now()
    count = Friendship.objects.filter(
        status="pending", created_at__lt=now - timedelta(days=30)
    ).update(status="rejected", updated_at=now)

    return f"Reject {count} long pending friendship requests."
