import logging

from django.conf import settings
from django.http import HttpResponse

logger = logging.getLogger("django.request")


class UploadSizeLimitMiddleware:
    """Reject oversized requests by ``Content-Length``, with a higher ceiling for
    the admin (firmware release uploads) than for the app's own API endpoints.

    Placed above ``LoggingMiddleware`` so oversized app requests are rejected
    before the body is read. Only the header is inspected, so the check is cheap
    and never buffers the body.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.admin_prefix = settings.ADMIN_URL_PREFIX
        self.app_limit = settings.APP_UPLOAD_MAX_SIZE
        self.admin_limit = settings.ADMIN_UPLOAD_MAX_SIZE

    def __call__(self, request):
        content_length = int(request.META.get("CONTENT_LENGTH") or 0)
        if content_length:
            is_admin = request.path.startswith(self.admin_prefix)
            limit = self.admin_limit if is_admin else self.app_limit
            if limit is not None and content_length > limit:
                logger.warning(
                    "Rejected %s %s: Content-Length %d exceeds limit %d",
                    request.method,
                    request.path,
                    content_length,
                    limit,
                )
                return HttpResponse("Request entity too large", status=413)
        return self.get_response(request)
