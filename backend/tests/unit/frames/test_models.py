import base64

import pytest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from django.core.exceptions import ValidationError

from frames.models import Frame


def frame_with(public_key):
    return Frame(
        public_serial_number="XXXX-XXXX-XXXX-XXXX",
        private_serial_number="UNIT-PRIVATE-0001",
        public_key=public_key,
    )


def test_accepts_a_real_ed25519_key():
    raw = Ed25519PrivateKey.generate().public_key().public_bytes_raw()

    frame_with(base64.b64encode(raw).decode()).clean()


def test_rejects_a_key_of_the_wrong_length():
    short = base64.b64encode(b"too short").decode()

    with pytest.raises(ValidationError) as error:
        frame_with(short).clean()

    assert "public_key" in error.value.message_dict


def test_rejects_invalid_base64():
    with pytest.raises(ValidationError):
        frame_with("!!!").clean()


def test_a_frame_without_a_key_is_valid():
    frame_with(None).clean()
