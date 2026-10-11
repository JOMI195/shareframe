import io

import pytest
from django.core.management import call_command
from django.utils import timezone
from PIL import Image as PILImage

from changelogs.models import Changelog, ChangelogImage
from frames.models import Frame, FrameGroup
from friendships.models import Friendship
from images.models import Image, ImageSize
from notifications.models import Notification
from sent_images.models import SentImage, SentImageStatus
from tests.support import seed
from tests.support.helpers.images import image_bytes
from user_accounts.avatars import AVATAR_SIZE, set_avatar
from user_accounts.models import Account, NotificationPreference
from user_core.models import User
from user_stats.models import UserStats

pytestmark = pytest.mark.django_db


def _counts():
    return {
        "users": User.objects.filter(username__startswith="seed_").count(),
        "groups": FrameGroup.objects.count(),
        "frames": Frame.objects.count(),
        "images": Image.objects.count(),
        "friendships": Friendship.objects.count(),
        "sent_images": SentImage.objects.count(),
        "changelogs": Changelog.objects.count(),
        "changelog_images": ChangelogImage.objects.count(),
        "notifications": Notification.objects.count(),
        "user_stats": UserStats.objects.count(),
    }


def test_corpus_matches_seed_data():
    assert _counts() == {
        "users": len(seed.users()),
        "groups": len(seed.frame_groups()),
        "frames": len(seed.frames()),
        "images": len(seed.images()),
        "friendships": len(seed.friendships()),
        "sent_images": len(seed.sent_images()),
        "changelogs": len(seed.changelogs()),
        "changelog_images": sum(len(c.get("images", [])) for c in seed.changelogs()),
        "notifications": len(seed.notifications()),
        "user_stats": len(seed.user_stats()),
    }


def test_image_sizes_exist():
    assert set(ImageSize.objects.values_list("name", flat=True)) == {
        "large",
        "medium",
        "thumbnail",
    }


def _avatars():
    return set(Account.objects.exclude(avatar="").values_list("avatar", flat=True))


def test_seeding_again_changes_nothing():
    before = _counts()
    avatars_before = _avatars()

    call_command("create_image_sizes", verbosity=0)
    call_command("seed_dev_data", verbosity=0)
    call_command("seed_changelogs", verbosity=0)
    call_command("seed_notifications", verbosity=0)
    call_command("seed_user_stats", verbosity=0)

    assert _counts() == before
    assert _avatars() == avatars_before


def test_a_friendship_that_moved_on_is_not_seeded_twice():
    friendship = Friendship.objects.filter(status="pending").first()
    friendship.status = "accepted"
    friendship.save()
    before = _counts()

    call_command("seed_dev_data", verbosity=0)

    assert _counts() == before
    friendship.refresh_from_db()
    assert friendship.status == "accepted"


def test_scheduled_sent_images_are_seeded_as_scheduled():
    specs = [s for s in seed.sent_images() if "scheduled_in_days" in s]

    for spec in specs:
        sent_image = SentImage.objects.get(
            sender__username=spec["sender"],
            reciever__username=spec["reciever"],
            image__display_name=spec["image_display_name"],
        )
        assert sent_image.status == SentImageStatus.SCHEDULED
        assert sent_image.scheduled_for > timezone.now()
        assert sent_image.expires_at > sent_image.scheduled_for
    assert specs


def test_seeded_reminders_are_backdated():
    for spec in seed.notifications():
        notification = Notification.objects.get(
            account__user__username=spec["username"], kind=spec["kind"]
        )
        assert (timezone.now() - notification.sent_at).days == spec["sent_days_ago"]


def test_users_with_a_join_offset_are_backdated():
    for spec in seed.users().values():
        if "joined_days_ago" in spec:
            user = User.objects.get(username=spec["username"])
            assert (timezone.now() - user.date_joined).days == spec["joined_days_ago"]


def test_seeded_notification_preferences_are_applied():
    for spec in seed.notification_preferences():
        assert (
            NotificationPreference.is_enabled(
                User.objects.get(username=spec["username"]).account,
                spec["kind"],
                spec["channel"],
            )
            is spec["enabled"]
        )


def test_seeded_user_stats_are_applied():
    for username, spec in seed.user_stats().items():
        stats = UserStats.objects.get(user__username=username)
        for field in UserStats.COUNTERS:
            assert getattr(stats, field) == spec[field]


def test_reseeding_keeps_live_user_stats():
    stats = UserStats.objects.get(user__username=seed.ALICE)
    UserStats.objects.filter(pk=stats.pk).update(images_sent=999)

    call_command("seed_user_stats", verbosity=0)

    stats.refresh_from_db()
    assert stats.images_sent == 999


def test_zeroed_user_stats_get_the_seeded_counts():
    UserStats.objects.filter(user__username=seed.ALICE).update(
        images_uploaded=0, images_sent=0, images_received=0
    )

    call_command("seed_user_stats", verbosity=0)

    stats = UserStats.objects.get(user__username=seed.ALICE)
    assert stats.images_sent == seed.user_stats()[seed.ALICE]["images_sent"]


def test_seeded_avatars_are_applied():
    with_avatar = seed.avatar_files()

    for user in User.objects.filter(username__startswith="seed_"):
        avatar = user.account.avatar
        assert bool(avatar) == (user.username in with_avatar), user.username
        if avatar:
            with PILImage.open(avatar.path) as image:
                assert image.size == (AVATAR_SIZE, AVATAR_SIZE)


def test_reseeding_keeps_a_replaced_avatar():
    account = User.objects.get(username=seed.ALICE).account
    set_avatar(account, io.BytesIO(image_bytes()))
    replaced = account.avatar.name

    call_command("seed_dev_data", verbosity=0)

    account.refresh_from_db()
    assert account.avatar.name == replaced
