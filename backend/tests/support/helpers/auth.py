"""Signing in the way the SPA does: cookie JWT plus a double-submit CSRF token."""

from django.conf import settings
from rest_framework.test import APIClient

from tests.support import seed

CSRF_SAFE_METHODS = {"get", "head", "options", "trace"}


class CookieClient(APIClient):
    """Echoes the csrftoken cookie back as X-CSRFToken.

    Enforcement is on by default: DRF marks every APIView csrf_exempt, so the check
    inside CookieJWTAuthentication only runs when the client asks for it.
    """

    def __init__(self, enforce_csrf_checks=True, **kwargs):
        super().__init__(enforce_csrf_checks=enforce_csrf_checks, **kwargs)

    def generic(self, method, path, *args, **kwargs):
        token = self.cookies.get("csrftoken")
        if token and method.lower() not in CSRF_SAFE_METHODS:
            kwargs.setdefault("headers", {}).setdefault("x-csrftoken", token.value)
        return super().generic(method, path, *args, **kwargs)

    @property
    def access_token(self):
        cookie = self.cookies.get(settings.AUTH_COOKIE_ACCESS_NAME)
        return cookie.value if cookie else None

    @property
    def refresh_token(self):
        cookie = self.cookies.get(settings.AUTH_COOKIE_REFRESH_NAME)
        return cookie.value if cookie else None


def sign_in_with(client, email, password):
    client.get("/api/auth/csrf/")
    response = client.post(
        "/api/auth/jwt/create/",
        {"email": email, "password": password},
        format="json",
    )
    assert response.status_code == 200, response.data
    return client


def sign_in(client, username=seed.ALICE):
    return sign_in_with(client, *seed.credentials(username))
