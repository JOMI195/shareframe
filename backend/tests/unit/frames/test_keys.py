import base64

import pytest

from frames.keys import public_key_fingerprint

# A frame from seed-data/frames.json and the serial seed_dev_data derives for it.
SEED_PUBLIC_KEY = "MOGhe35ZWAgo0NLXew7cbwdmq36+kDwFmo/xd8VSbVY="
SEED_SERIAL = "FYCW-W4X7-NWOC-FSOO"


def test_derives_the_documented_serial():
    assert public_key_fingerprint(SEED_PUBLIC_KEY) == SEED_SERIAL


def test_is_four_groups_of_four_uppercase_base32():
    fingerprint = public_key_fingerprint(SEED_PUBLIC_KEY)

    groups = fingerprint.split("-")
    assert len(groups) == 4
    assert all(len(group) == 4 for group in groups)
    assert fingerprint == fingerprint.upper()


def test_is_deterministic():
    key = base64.b64encode(bytes(range(32))).decode()

    assert public_key_fingerprint(key) == public_key_fingerprint(key)


def test_a_different_key_gives_a_different_serial():
    other = base64.b64encode(bytes(range(32))).decode()

    assert public_key_fingerprint(other) != SEED_SERIAL


def test_rejects_input_that_is_not_base64():
    with pytest.raises(Exception):
        public_key_fingerprint("not base64 at all!!")
