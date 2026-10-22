import pytest

pytestmark = pytest.mark.django_db

URL = "/api/health/"


def test_answers_anonymously_without_touching_the_database(
    client, django_assert_num_queries
):
    with django_assert_num_queries(0):
        response = client.get(URL)

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


# Polled while sessions may be half expired, so a broken cookie must not turn it into a 401.
def test_ignores_an_invalid_auth_cookie(client, settings):
    client.cookies[settings.AUTH_COOKIE_ACCESS_NAME] = "not-a-jwt"

    assert client.get(URL).status_code == 200


# The Docker healthcheck calls plain HTTP inside the container network.
def test_is_exempt_from_the_https_redirect(client, settings):
    settings.SECURE_SSL_REDIRECT = True

    assert client.get(URL).status_code == 200
    assert client.get("/api/auth/csrf/").status_code == 301
