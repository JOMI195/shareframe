from config.celery import celery
from django.utils import timezone
from datetime import timedelta
from .models import Friendship


@celery.task
def reject_long_pending_friendship_requestes():
    """Reject friendship requests who haven't accepted their requests within 30 days."""
    time_threshold = timezone.now() - timedelta(days=30)
    pending_friendships = Friendship.objects.filter(
        status="pending", created_at__lt=time_threshold
    )
    count = pending_friendships.count()
    for request in pending_friendships:
        request.status = "rejected"

    return f"Reject {count} long pending friendship requests."
