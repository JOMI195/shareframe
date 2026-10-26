from types import SimpleNamespace

import pytest
from django.core import signing
from freezegun import freeze_time

from user_core.email_change import SALT, make_token, matches, read_token

USER = SimpleNamespace(pk=7, email="old@example.com")


def test_a_token_reads_back_to_its_user_and_new_address():
    user_id, new_email, fingerprint = read_token(make_token(USER, "new@example.com"))

    assert (user_id, new_email) == (7, "new@example.com")
    assert matches(USER, fingerprint)


def test_the_old_address_is_not_readable_from_the_token():
    token = make_token(USER, "new@example.com")

    assert "old@example.com" not in str(signing.loads(token, salt=SALT))


def test_a_token_no_longer_matches_once_the_address_changed():
    _, _, fingerprint = read_token(make_token(USER, "new@example.com"))

    assert not matches(SimpleNamespace(pk=7, email="new@example.com"), fingerprint)


def test_a_tampered_token_is_rejected():
    token = make_token(USER, "new@example.com")

    with pytest.raises(signing.BadSignature):
        read_token(token[:-1] + ("A" if token[-1] != "A" else "B"))


def test_a_token_from_another_salt_is_rejected():
    with pytest.raises(signing.BadSignature):
        read_token(signing.dumps([7, "new@example.com", "x"]))


def test_a_token_expires_after_a_day():
    with freeze_time("2026-01-01 12:00:00"):
        token = make_token(USER, "new@example.com")

    with freeze_time("2026-01-02 12:00:01"), pytest.raises(signing.SignatureExpired):
        read_token(token)
