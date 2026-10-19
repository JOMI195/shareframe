import json
import os

import pytest
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from frames.models import FrameWebsocketConnection
from friendships.models import Friendship
from images.models import Image, TextPreset
from sent_images.models import SentImage
from tests.support import seed
from tests.support.factories import (
    FrameFactory,
    FriendshipFactory,
    ImageFactory,
    SentImageFactory,
    TextPresetFactory,
    UserFactory,
)
from user_accounts.models import Account
from user_core.blacklist import USERNAME_BLACKLIST
from user_core.models import User
from user_stats.models import UserStats

pytestmark = pytest.mark.django_db


class TestCreateUser:
    def test_creates_the_account_alongside(self):
        user = UserFactory()

        assert Account.objects.filter(user=user).exists()
        assert user.account.friendship_user_search_code

    def test_normalises_the_email_domain(self):
        user = User.objects.create_user(
            email="Mixed.Case@ShareFrame.Local", username="normalise_me", password="x1"
        )

        assert user.email == "Mixed.Case@shareframe.local"

    def test_the_password_is_hashed(self):
        user = UserFactory(password="factory-pass1")

        assert user.password != "factory-pass1"
        assert user.check_password("factory-pass1")

    def test_requires_an_email(self):
        with pytest.raises(ValueError):
            User.objects.create_user(email="", username="no_mail", password="x1")

    def test_rejects_a_blacklisted_username(self):
        with pytest.raises(ValueError):
            User.objects.create_user(
                email="banned@shareframe.local",
                username=USERNAME_BLACKLIST[0],
                password="x1",
            )

    def test_a_rejected_username_leaves_no_account_behind(self):
        before = Account.objects.count()

        with pytest.raises(ValueError):
            User.objects.create_user(
                email="banned2@shareframe.local",
                username=USERNAME_BLACKLIST[0],
                password="x1",
            )

        assert Account.objects.count() == before

    def test_a_new_user_is_inactive(self):
        assert not UserFactory().is_active


def test_create_superuser_sets_the_staff_flags():
    admin = User.objects.create_superuser(
        email="root@shareframe.local", username="root_user", password="x1"
    )

    assert admin.is_staff and admin.is_admin and admin.is_active


def frame_online(frame):
    layer = get_channel_layer()
    channel = async_to_sync(layer.new_channel)()
    FrameWebsocketConnection.objects.create(frame=frame, channel_name=channel)
    return lambda: json.loads(async_to_sync(layer.receive)(channel)["data"])


class TestDelete:
    def test_the_row_is_gone(self):
        user = UserFactory()
        pk = user.pk

        user.delete()

        assert not User.objects.filter(pk=pk).exists()
        assert not Account.objects.filter(user_id=pk).exists()

    def test_the_image_files_are_removed(self):
        image = ImageFactory()
        paths = [image.image.path] + [v.file.path for v in image.variants.all()]

        image.user.delete()

        assert not Image.objects.filter(pk=image.pk).exists()
        assert not any(os.path.exists(path) for path in paths)

    def test_sent_images_in_both_directions_are_removed(self):
        user = UserFactory()
        outgoing = SentImageFactory(sender=user)
        incoming = SentImageFactory(reciever=user)

        user.delete()

        assert not SentImage.objects.filter(pk__in=[outgoing.pk, incoming.pk]).exists()

    def test_a_received_image_stays_with_its_owner(self):
        incoming = SentImageFactory()

        incoming.reciever.delete()

        assert Image.objects.filter(pk=incoming.image_id).exists()

    def test_friendships_and_presets_are_removed(self):
        user = UserFactory()
        friendship = FriendshipFactory(sender=user)
        preset = TextPresetFactory(user=user)

        user.delete()

        assert not Friendship.objects.filter(pk=friendship.pk).exists()
        assert not TextPreset.objects.filter(pk=preset.pk).exists()

    def test_the_frames_are_released(self):
        frame = FrameFactory(user=UserFactory())

        frame.user.delete()

        frame.refresh_from_db()
        assert frame.user is None

    def test_the_stats_stay_without_the_user(self):
        user = UserFactory()
        stats_pk = UserStats.objects.get_or_create(user=user)[0].pk

        user.delete()

        assert UserStats.objects.get(pk=stats_pk).user is None

    def test_a_friends_frame_drops_the_users_photos(
        self, django_capture_on_commit_callbacks
    ):
        sent_image = SentImageFactory()
        receive = frame_online(FrameFactory(user=sent_image.reciever))

        with django_capture_on_commit_callbacks(execute=True):
            sent_image.sender.delete()

        assert receive() == {
            "type": "clear_specific_sent_images",
            "sent_image_ids": [sent_image.pk],
        }

    def test_the_users_own_frame_is_cleared(self, django_capture_on_commit_callbacks):
        sent_image = SentImageFactory()
        receive = frame_online(FrameFactory(user=sent_image.reciever))

        with django_capture_on_commit_callbacks(execute=True):
            sent_image.reciever.delete()

        assert receive()["sent_image_ids"] == [sent_image.pk]

    def test_scheduled_images_are_not_pushed(self, django_capture_on_commit_callbacks):
        SentImageFactory(scheduled=True)
        sent_image = SentImageFactory()
        receive = frame_online(FrameFactory(user=sent_image.reciever))

        with django_capture_on_commit_callbacks(execute=True):
            sent_image.sender.delete()

        assert receive()["sent_image_ids"] == [sent_image.pk]


def test_the_seeded_accounts_are_active():
    assert User.objects.get(username=seed.ALICE).is_active


def test_the_email_is_the_login_field():
    assert User.USERNAME_FIELD == "email"
