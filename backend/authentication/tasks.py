from config.celery import celery
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
from rest_framework_simplejwt.utils import aware_utcnow


@celery.task
def flush_expired_tokens():
    """Delete outstanding tokens past expiry; blacklist rows cascade with them."""
    expired = OutstandingToken.objects.filter(expires_at__lte=aware_utcnow())
    count = expired.count()
    expired.delete()
    return f"Deleted {count} expired tokens."
