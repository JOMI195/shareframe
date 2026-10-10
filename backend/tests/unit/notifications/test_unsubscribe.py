from types import SimpleNamespace

import pytest
from django.core import signing

from notifications.unsubscribe import make_token, read_token

ACCOUNT = SimpleNamespace(pk=7)


def test_a_token_reads_back_to_its_account_kind_and_channel():
    token = make_token(ACCOUNT, "inactivity_reminder", "email")

    assert read_token(token) == (7, "inactivity_reminder", "email")


def test_a_tampered_token_is_rejected():
    token = make_token(ACCOUNT, "inactivity_reminder", "email")

    with pytest.raises(signing.BadSignature):
        read_token(token[:-1] + ("A" if token[-1] != "A" else "B"))


def test_a_token_from_another_salt_is_rejected():
    token = signing.dumps([7, "inactivity_reminder", "email"])

    with pytest.raises(signing.BadSignature):
        read_token(token)
