from config.celery import celery
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from .models import SentImage


@celery.task
def delete_long_expired_sent_images():
    """Delete sent images that expired more than the defined days ago."""
    delete_days = getattr(settings, "SENT_IMAGE_DELETE_DAYS", 7)
    time_threshold = timezone.now() - timedelta(days=delete_days)
    expired_images = SentImage.objects.filter(expires_at__lt=time_threshold)
    count = expired_images.count()
    expired_images.delete()
    return f"Deleted {count} long expired sent images."
