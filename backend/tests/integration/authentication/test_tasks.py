import datetime

import pytest
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.utils import aware_utcnow

from authentication.tasks import flush_expired_tokens
from tests.support.factories import UserFactory

pytestmark = pytest.mark.django_db


def outstanding_for(user, expires_at=None):
    RefreshToken.for_user(user)
    token = OutstandingToken.objects.filter(user=user).latest("created_at")
    if expires_at:
        OutstandingToken.objects.filter(pk=token.pk).update(expires_at=expires_at)
    return token


def test_deletes_an_expired_token():
    token = outstanding_for(
        UserFactory(), expires_at=aware_utcnow() - datetime.timedelta(days=1)
    )

    flush_expired_tokens()

    assert not OutstandingToken.objects.filter(pk=token.pk).exists()


def test_keeps_a_live_token():
    token = outstanding_for(UserFactory())

    flush_expired_tokens()

    assert OutstandingToken.objects.filter(pk=token.pk).exists()


def test_reports_how_many_it_deleted():
    outstanding_for(UserFactory(), expires_at=aware_utcnow() - datetime.timedelta(days=1))

    assert flush_expired_tokens() == "Deleted 1 expired tokens."
