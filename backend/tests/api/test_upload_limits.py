"""Only the rejected cases work through the client: a request the middleware lets
through would need a real body of that size. The accepted branches are unit tests."""

import pytest
from django.conf import settings

pytestmark = pytest.mark.django_db

URL = "/api/images/"


def post_claiming(client, url, content_length):
    return client.post(
        url,
        data=b"",
        content_type="multipart/form-data; boundary=x",
        CONTENT_LENGTH=str(content_length),
    )


def test_an_app_upload_over_the_limit_is_rejected(alice):
    response = post_claiming(alice, URL, settings.APP_UPLOAD_MAX_SIZE + 1)

    assert response.status_code == 413


def test_the_admin_ceiling_is_higher_than_the_app_one(alice):
    """A GET keeps the view from reading a body the test client never sent."""
    response = alice.get(
        settings.ADMIN_URL_PREFIX, CONTENT_LENGTH=str(settings.APP_UPLOAD_MAX_SIZE + 1)
    )

    assert response.status_code != 413


def test_the_admin_limit_still_applies(alice):
    response = alice.get(
        settings.ADMIN_URL_PREFIX,
        CONTENT_LENGTH=str(settings.ADMIN_UPLOAD_MAX_SIZE + 1),
    )

    assert response.status_code == 413


def test_the_rejection_happens_before_authentication(client):
    response = post_claiming(client, URL, settings.APP_UPLOAD_MAX_SIZE + 1)

    assert response.status_code == 413
