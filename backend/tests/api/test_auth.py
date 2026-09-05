import pytest
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken

from tests.support import seed
from tests.support.helpers.auth import CookieClient
from user_core.models import User

pytestmark = pytest.mark.django_db

CSRF_URL = "/api/auth/csrf/"
CREATE_URL = "/api/auth/jwt/create/"
REFRESH_URL = "/api/auth/jwt/refresh/"
VERIFY_URL = "/api/auth/jwt/verify/"
LOGOUT_URL = "/api/auth/jwt/logout/"
ME_URL = "/api/auth/users/me/"


def test_csrf_endpoint_sets_the_cookie(client):
    response = client.get(CSRF_URL)

    assert response.status_code == 204
    assert client.cookies["csrftoken"].value


def test_sign_in_sets_both_auth_cookies_and_hides_the_tokens(client):
    client.get(CSRF_URL)
    email, password = seed.credentials(seed.ALICE)

    response = client.post(CREATE_URL, {"email": email, "password": password}, format="json")

    assert response.status_code == 200
    assert response.data == {"detail": "Authenticated."}
    access = client.cookies[settings.AUTH_COOKIE_ACCESS_NAME]
    refresh = client.cookies[settings.AUTH_COOKIE_REFRESH_NAME]
    assert access["httponly"] and refresh["httponly"]
    assert access["path"] == settings.AUTH_COOKIE_ACCESS_PATH
    assert refresh["path"] == settings.AUTH_COOKIE_REFRESH_PATH
    assert access["samesite"] == settings.AUTH_COOKIE_SAMESITE


def test_sign_in_rejects_a_wrong_password(client):
    client.get(CSRF_URL)
    email, _ = seed.credentials(seed.ALICE)

    response = client.post(CREATE_URL, {"email": email, "password": "wrong-pass1"}, format="json")

    assert response.status_code == 401
    assert settings.AUTH_COOKIE_ACCESS_NAME not in client.cookies


def test_the_access_cookie_authenticates(alice):
    response = alice.get(ME_URL)

    assert response.status_code == 200
    assert response.data["username"] == seed.ALICE


def test_an_authorization_header_is_ignored(client):
    """CookieJWTAuthentication reads the cookie only; Bearer is no longer accepted."""
    token = RefreshToken.for_user(User.objects.get(username=seed.ALICE))

    response = client.get(ME_URL, headers={"Authorization": f"Bearer {token.access_token}"})

    assert response.status_code == 401


def test_unsafe_requests_need_the_csrf_header(alice):
    alice.cookies.pop("csrftoken")

    response = alice.patch(ME_URL, {"username": "nope"}, format="json")

    assert response.status_code == 403


def test_refresh_rotates_and_blacklists_the_old_token(alice):
    original = alice.refresh_token

    response = alice.post(REFRESH_URL, {}, format="json")

    assert response.status_code == 200
    assert alice.refresh_token != original

    stale = CookieClient()
    stale.get(CSRF_URL)
    stale.cookies[settings.AUTH_COOKIE_REFRESH_NAME] = original
    assert stale.post(REFRESH_URL, {}, format="json").status_code == 401


def test_refresh_without_the_cookie_is_unauthorized(client):
    client.get(CSRF_URL)

    response = client.post(REFRESH_URL, {}, format="json")

    assert response.status_code == 401


def test_verify_accepts_the_access_token(alice):
    response = alice.post(VERIFY_URL, {"token": alice.access_token}, format="json")

    assert response.status_code == 200


def test_logout_clears_the_cookies_and_kills_the_session(alice):
    response = alice.post(LOGOUT_URL, {}, format="json")

    assert response.status_code == 204
    assert alice.cookies[settings.AUTH_COOKIE_ACCESS_NAME].value == ""
    assert alice.get(ME_URL).status_code == 401
