import io

import pytest
from django.conf import settings

from tests.support import seed
from tests.support.factories import UserFactory
from tests.support.helpers.images import image_bytes
from user_accounts.avatars import avatar_url, clear_avatar, set_avatar
from user_accounts.serializers import AccountRetrieveSerializer
from user_core.models import User

pytestmark = pytest.mark.django_db


def _upload():
    return io.BytesIO(image_bytes(size=(80, 60)))


def _exists(name):
    return (settings.MEDIA_ROOT / name).exists()


def test_set_avatar_stores_a_new_file(django_capture_on_commit_callbacks):
    account = UserFactory().account

    with django_capture_on_commit_callbacks(execute=True):
        set_avatar(account, _upload())

    assert account.avatar.name.startswith("avatars/")
    assert _exists(account.avatar.name)


def test_replacing_deletes_the_old_file(django_capture_on_commit_callbacks):
    account = UserFactory().account
    with django_capture_on_commit_callbacks(execute=True):
        set_avatar(account, _upload())
    old_name = account.avatar.name

    with django_capture_on_commit_callbacks(execute=True):
        set_avatar(account, _upload())

    assert account.avatar.name != old_name
    assert not _exists(old_name)
    assert _exists(account.avatar.name)


def test_clear_avatar_deletes_the_file(django_capture_on_commit_callbacks):
    account = UserFactory().account
    with django_capture_on_commit_callbacks(execute=True):
        set_avatar(account, _upload())
    name = account.avatar.name

    with django_capture_on_commit_callbacks(execute=True):
        clear_avatar(account)

    account.refresh_from_db()
    assert not account.avatar
    assert not _exists(name)


def test_deleting_the_user_removes_the_avatar(django_capture_on_commit_callbacks):
    user = UserFactory()
    with django_capture_on_commit_callbacks(execute=True):
        set_avatar(user.account, _upload())
    name = user.account.avatar.name

    with django_capture_on_commit_callbacks(execute=True):
        user.delete()

    assert not _exists(name)


def test_avatar_url_is_none_without_a_picture():
    assert avatar_url(UserFactory()) is None


def test_serializer_exposes_the_media_url():
    user = User.objects.get(username=seed.ALICE)

    data = AccountRetrieveSerializer(user.account).data

    assert data["avatar"] == settings.MEDIA_URL + user.account.avatar.name
