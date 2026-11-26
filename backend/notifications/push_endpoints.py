from urllib.parse import urlparse

# The browser picks the endpoint, and Celery posts to it, so only real push services pass.
PUSH_SERVICE_HOSTS = (
    "fcm.googleapis.com",
    "push.services.mozilla.com",
    "notify.windows.com",
    "push.apple.com",
)


def is_push_service_url(url):
    try:
        parsed = urlparse(url)
        port = parsed.port
    except (ValueError, TypeError, AttributeError):
        return False
    host = (parsed.hostname or "").lower()
    if parsed.scheme != "https" or port not in (None, 443):
        return False
    return any(host == h or host.endswith("." + h) for h in PUSH_SERVICE_HOSTS)
