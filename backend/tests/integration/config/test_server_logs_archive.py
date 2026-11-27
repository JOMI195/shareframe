import gzip
import tarfile

import pytest

from config.server_logs import build_archive


@pytest.fixture
def logs(settings, tmp_path):
    directory = tmp_path / "logs"
    directory.mkdir()
    settings.LOGS_DIR = str(directory)
    return directory


def build(tmp_path):
    path = tmp_path / "archive.tar.gz"
    build_archive(path)
    with tarfile.open(path) as tar:
        return {m.name: tar.extractfile(m).read() for m in tar}


def test_a_file_over_the_per_file_cap_keeps_only_its_newest_bytes(
    logs, tmp_path, settings
):
    settings.SERVER_LOGS_MAX_FILE_BYTES = 4
    (logs / "nginx-access.log").write_bytes(b"old-new!")

    assert build(tmp_path) == {"nginx-access.log": b"new!"}


def test_the_total_budget_goes_to_live_files_before_rotated_ones(
    logs, tmp_path, settings
):
    settings.SERVER_LOGS_MAX_TOTAL_BYTES = 6
    (logs / "a.log.1").write_bytes(b"rotated")
    (logs / "b.log").write_bytes(b"live")

    assert build(tmp_path) == {"b.log": b"live", "a.log.1": b"ed"}


def test_a_compressed_file_is_left_out_rather_than_cut(logs, tmp_path, settings):
    settings.SERVER_LOGS_MAX_FILE_BYTES = 10
    (logs / "nginx-access.log.2.gz").write_bytes(gzip.compress(b"x" * 1000))
    (logs / "nginx-access.log").write_bytes(b"live")

    assert build(tmp_path) == {"nginx-access.log": b"live"}


def test_empty_files_are_still_listed(logs, tmp_path, settings):
    settings.SERVER_LOGS_MAX_TOTAL_BYTES = 0
    (logs / "nginx-error.log").write_bytes(b"")

    assert build(tmp_path) == {"nginx-error.log": b""}
