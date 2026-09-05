import pytest

pytestmark = pytest.mark.django_db

URL = "/api/version/"


def test_requires_authentication(client):
    assert client.get(URL).status_code == 401


def test_reports_the_build_version(alice, settings):
    response = alice.get(URL)

    assert response.status_code == 200
    assert response.data["version"] == settings.APP_BUILD_VERSION


def test_an_empty_build_version_is_reported_as_null(alice, settings):
    settings.APP_BUILD_VERSION = ""

    assert alice.get(URL).data["version"] is None
