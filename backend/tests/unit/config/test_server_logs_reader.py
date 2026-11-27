import io

from config.server_logs import _SnapshotReader


def test_reads_stop_at_the_snapshot_size():
    reader = _SnapshotReader(io.BytesIO(b"0123456789"), 4)

    assert reader.read(3) + reader.read(3) + reader.read(3) == b"0123"


def test_a_file_that_shrank_is_padded_to_the_snapshot_size():
    reader = _SnapshotReader(io.BytesIO(b"abc"), 6)

    assert reader.read() == b"abc\0\0\0"
