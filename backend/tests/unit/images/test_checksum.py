import hashlib
import io

from images.checksum import (
    compare_sha256_sums,
    get_sha256_sum_from_file,
    get_sha256_sum_from_path,
)

CONTENT = b"shareframe" * 1000


def test_hashes_a_file_object():
    assert get_sha256_sum_from_file(io.BytesIO(CONTENT)) == hashlib.sha256(CONTENT).hexdigest()


def test_hashes_a_path(tmp_path):
    target = tmp_path / "photo.bin"
    target.write_bytes(CONTENT)

    assert get_sha256_sum_from_path(str(target)) == hashlib.sha256(CONTENT).hexdigest()


def test_the_two_readers_agree(tmp_path):
    target = tmp_path / "photo.bin"
    target.write_bytes(CONTENT)

    assert get_sha256_sum_from_path(str(target)) == get_sha256_sum_from_file(io.BytesIO(CONTENT))


def test_hashes_an_empty_input():
    assert get_sha256_sum_from_file(io.BytesIO(b"")) == hashlib.sha256(b"").hexdigest()


def test_reading_spans_several_blocks():
    """The readers loop in 4 KB blocks."""
    big = b"x" * (4096 * 3 + 17)

    assert get_sha256_sum_from_file(io.BytesIO(big)) == hashlib.sha256(big).hexdigest()


def test_compare_is_exact():
    digest = hashlib.sha256(CONTENT).hexdigest()

    assert compare_sha256_sums(digest, digest)
    assert not compare_sha256_sums(digest, digest.upper())
    assert not compare_sha256_sums(digest, "")
