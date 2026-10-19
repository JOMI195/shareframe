from datetime import timedelta

import pytest
from django.utils import timezone

from tests.support.factories import UserFactory
from user_core.models import User
from user_core.tasks import delete_inactive_users

pytestmark = pytest.mark.django_db


def joined_days_ago(days, **kwargs):
    return UserFactory(date_joined=timezone.now() - timedelta(days=days), **kwargs)


def exists(user):
    return User.objects.filter(pk=user.pk).exists()


def test_a_stale_unactivated_account_is_deleted():
    user = joined_days_ago(2)

    delete_inactive_users()

    assert not exists(user)


def test_a_fresh_unactivated_account_is_kept():
    user = joined_days_ago(0)

    delete_inactive_users()

    assert exists(user)


def test_a_deactivated_account_that_signed_in_is_kept():
    user = joined_days_ago(30, last_login=timezone.now() - timedelta(days=5))

    delete_inactive_users()

    assert exists(user)


def test_an_active_account_is_kept():
    user = joined_days_ago(30, is_active=True)

    delete_inactive_users()

    assert exists(user)
