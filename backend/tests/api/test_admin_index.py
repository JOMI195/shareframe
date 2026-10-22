import pytest
from django.test import Client

from tests.support.factories import UserFactory

pytestmark = pytest.mark.django_db

URL = "/api/admin/"
LOGS_LINK = "Download server logs"
LOGO = "brand/logo-dark-full-shareframe.svg"


@pytest.fixture
def admin_client():
    client = Client()
    client.force_login(UserFactory(is_active=True, is_staff=True, is_admin=True))
    return client


@pytest.fixture
def staff_client():
    client = Client()
    client.force_login(UserFactory(is_active=True, is_staff=True, is_admin=False))
    return client


def test_staff_sees_the_backend_version(staff_client, settings):
    settings.APP_BUILD_VERSION = "2026-01-01-abcdef12"

    response = staff_client.get(URL)

    assert response.status_code == 200
    assert "2026-01-01-abcdef12" in response.content.decode()


def test_an_empty_build_version_reads_unknown(staff_client, settings):
    settings.APP_BUILD_VERSION = ""

    assert "<td>unknown</td>" in staff_client.get(URL).content.decode()


# The login page is public, so the version must not leak there.
def test_the_login_page_does_not_show_the_version(client, settings):
    settings.APP_BUILD_VERSION = "2026-01-01-abcdef12"

    response = client.get(f"{URL}login/")

    assert response.status_code == 200
    assert "2026-01-01-abcdef12" not in response.content.decode()


def test_only_admins_get_the_server_logs_link(admin_client, staff_client):
    assert LOGS_LINK in admin_client.get(URL).content.decode()
    assert LOGS_LINK not in staff_client.get(URL).content.decode()


def test_the_header_shows_the_logo_on_login_and_index(client, staff_client):
    assert LOGO in client.get(f"{URL}login/").content.decode()
    assert LOGO in staff_client.get(URL).content.decode()
