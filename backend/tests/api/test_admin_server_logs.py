import tarfile

import pytest
from django.test import Client

from tests.support.factories import UserFactory

pytestmark = pytest.mark.django_db

URL = "/api/admin/server_logs/download/"


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


@pytest.fixture
def log_files(settings, tmp_path):
    logs = tmp_path / "logs"
    logs.mkdir()
    files = {
        "backend-application.log": b"current line\n",
        "backend-application.log.1": b"rotated line\n",
        "nginx-error.log": b"",
    }
    for name, content in files.items():
        (logs / name).write_bytes(content)
    settings.LOGS_DIR = str(logs)
    settings.MEDIA_ROOT = tmp_path / "media"
    return files


def archives(settings):
    return sorted((settings.MEDIA_ROOT / "server_logs").iterdir())


def test_opening_the_link_only_asks_for_confirmation(admin_client, log_files, settings):
    response = admin_client.get(URL)

    assert response.status_code == 200
    assert "Yes, download" in response.content.decode()
    assert not (settings.MEDIA_ROOT / "server_logs").exists()


def test_a_confirmed_download_hands_every_log_file_to_nginx(
    admin_client, log_files, settings
):
    response = admin_client.post(URL)

    assert response.status_code == 200
    assert response["X-Accel-Redirect"].startswith(
        "/api/media/protected/server_logs/server_logs-"
    )
    [archive] = archives(settings)
    assert response["X-Accel-Redirect"].endswith(archive.name)
    with tarfile.open(archive) as tar:
        assert {m.name: tar.extractfile(m).read() for m in tar} == log_files


def test_the_download_tells_the_confirm_page_to_go_back(admin_client, log_files):
    response = admin_client.post(URL)

    assert response.cookies["server_logs_ready"].value == "1"


def test_a_second_download_replaces_the_first_archive(
    admin_client, log_files, settings
):
    old = settings.MEDIA_ROOT / "server_logs" / "server_logs-old.tar.gz"
    old.parent.mkdir(parents=True)
    old.write_bytes(b"")

    admin_client.post(URL)

    [archive] = archives(settings)
    assert archive != old


def test_the_download_is_audited(admin_client, log_files, caplog):
    with caplog.at_level("INFO", logger="admin.audit"):
        admin_client.post(URL)

    assert "Server logs downloaded" in caplog.text


def test_staff_without_admin_rights_is_refused(staff_client, log_files):
    assert staff_client.get(URL).status_code == 403
    assert staff_client.post(URL).status_code == 403


def test_anonymous_is_sent_to_the_login(client, log_files):
    response = client.get(URL)

    assert response.status_code == 302
    assert "/api/admin/login/" in response["Location"]


def test_the_admin_index_links_the_download_for_admins_only(admin_client, staff_client):
    assert URL in admin_client.get("/api/admin/").content.decode()
    assert URL not in staff_client.get("/api/admin/").content.decode()
