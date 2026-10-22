import os
import time

import pytest

from config.tasks import delete_old_server_logs


@pytest.fixture
def archive_dir(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    return tmp_path / "server_logs"


def test_only_archives_older_than_15_minutes_are_deleted(archive_dir):
    archive_dir.mkdir()
    old = archive_dir / "server_logs-old.tar.gz"
    fresh = archive_dir / "server_logs-fresh.tar.gz"
    old.write_bytes(b"")
    fresh.write_bytes(b"")
    twenty_minutes_ago = time.time() - 20 * 60
    os.utime(old, (twenty_minutes_ago, twenty_minutes_ago))

    delete_old_server_logs()

    assert list(archive_dir.iterdir()) == [fresh]


def test_a_missing_directory_is_no_error(archive_dir):
    assert delete_old_server_logs() == "Deleted 0 server log archives."
