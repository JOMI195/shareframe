from django.conf import settings
from rest_framework.response import Response

from authentication.cookies import delete_auth_cookies, set_auth_cookies

ACCESS = settings.AUTH_COOKIE_ACCESS_NAME
REFRESH = settings.AUTH_COOKIE_REFRESH_NAME


def test_sets_both_cookies_httponly_and_scoped():
    response = set_auth_cookies(Response(), "access-token", "refresh-token")

    access, refresh = response.cookies[ACCESS], response.cookies[REFRESH]
    assert access.value == "access-token"
    assert refresh.value == "refresh-token"
    assert access["httponly"] and refresh["httponly"]
    assert access["path"] == settings.AUTH_COOKIE_ACCESS_PATH
    assert refresh["path"] == settings.AUTH_COOKIE_REFRESH_PATH
    assert access["samesite"] == settings.AUTH_COOKIE_SAMESITE


def test_max_age_mirrors_the_token_lifetimes():
    response = set_auth_cookies(Response(), "a", "r")

    assert response.cookies[ACCESS]["max-age"] == int(
        settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()
    )
    assert response.cookies[REFRESH]["max-age"] == int(
        settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()
    )


def test_secure_follows_the_deployment():
    response = set_auth_cookies(Response(), "a", "r")

    assert bool(response.cookies[ACCESS]["secure"]) == settings.AUTH_COOKIE_SECURE


def test_only_the_token_that_was_passed_is_set():
    only_access = set_auth_cookies(Response(), "a", None)
    only_refresh = set_auth_cookies(Response(), None, "r")

    assert ACCESS in only_access.cookies and REFRESH not in only_access.cookies
    assert REFRESH in only_refresh.cookies and ACCESS not in only_refresh.cookies


def test_delete_matches_the_paths_it_set():
    """Browsers match on name+path, so the two must agree."""
    response = delete_auth_cookies(Response())

    assert response.cookies[ACCESS].value == ""
    assert response.cookies[REFRESH].value == ""
    assert response.cookies[ACCESS]["path"] == settings.AUTH_COOKIE_ACCESS_PATH
    assert response.cookies[REFRESH]["path"] == settings.AUTH_COOKIE_REFRESH_PATH
    assert response.cookies[ACCESS]["samesite"] == settings.AUTH_COOKIE_SAMESITE
