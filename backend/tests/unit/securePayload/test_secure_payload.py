import base64
import json

import pytest
from freezegun import freeze_time

from securePayload.securePayload import SecurePayload

SECRET = "unit-test-secret"


def test_roundtrips_a_payload():
    token = SecurePayload.encrypt({"frame": "abc", "n": 3}, SECRET)

    assert SecurePayload.decrypt(token, SECRET) == {"frame": "abc", "n": 3}


def test_accepts_a_bytes_secret():
    token = SecurePayload.encrypt({"a": 1}, SECRET.encode())

    assert SecurePayload.decrypt(token, SECRET) == {"a": 1}


def test_rejects_another_secret():
    token = SecurePayload.encrypt({"a": 1}, SECRET)

    with pytest.raises(ValueError):
        SecurePayload.decrypt(token, "a-different-secret")


def test_rejects_a_tampered_body():
    token = SecurePayload.encrypt({"role": "user"}, SECRET)
    signature, body = base64.urlsafe_b64decode(token).decode().split(":", 1)
    forged = json.loads(body)
    forged["data"] = {"role": "admin"}
    tampered = base64.urlsafe_b64encode(
        f"{signature}:{json.dumps(forged)}".encode()
    ).decode()

    with pytest.raises(ValueError):
        SecurePayload.decrypt(tampered, SECRET)


def test_rejects_a_payload_past_its_max_age():
    with freeze_time("2026-01-01 12:00:00"):
        token = SecurePayload.encrypt({"a": 1}, SECRET)

    with freeze_time("2026-01-01 12:10:00"):
        with pytest.raises(ValueError):
            SecurePayload.decrypt(token, SECRET, max_age=300)


def test_accepts_a_payload_inside_its_max_age():
    with freeze_time("2026-01-01 12:00:00"):
        token = SecurePayload.encrypt({"a": 1}, SECRET)

    with freeze_time("2026-01-01 12:04:00"):
        assert SecurePayload.decrypt(token, SECRET, max_age=300) == {"a": 1}


def test_rejects_garbage():
    with pytest.raises(ValueError):
        SecurePayload.decrypt("not-a-token", SECRET)
