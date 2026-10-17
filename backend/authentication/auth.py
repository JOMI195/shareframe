import logging

from django.conf import settings
from rest_framework import exceptions
from rest_framework.authentication import CSRFCheck
from rest_framework_simplejwt.authentication import JWTAuthentication

from config.errors import CSRF_FAILED_DETAIL

logger = logging.getLogger("django.security.csrf")


def enforce_csrf(request):
    """Double-submit CSRF check; safe methods pass through."""

    def dummy_get_response(request):
        return None

    check = CSRFCheck(dummy_get_response)
    check.process_request(request)
    reason = check.process_view(request, None, (), {})
    if reason:
        logger.warning("CSRF failed on %s %s: %s", request.method, request.path, reason)
        raise exceptions.PermissionDenied(CSRF_FAILED_DETAIL)


class CookieJWTAuthentication(JWTAuthentication):
    """Cookie only; Authorization headers are ignored."""

    def authenticate(self, request):
        raw_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS_NAME)
        if not raw_token:
            return None

        validated_token = self.get_validated_token(raw_token)
        user = self.get_user(validated_token)
        enforce_csrf(request)
        return user, validated_token
