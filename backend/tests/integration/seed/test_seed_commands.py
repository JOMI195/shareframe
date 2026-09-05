import pytest
from django.core.management import call_command

from changelogs.models import Changelog
from frames.models import Frame, FrameGroup
from friendships.models import Friendship
from images.models import Image, ImageSize
from sent_images.models import SentImage
from tests.support import seed
from user_core.models import User

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
    }


def test_image_sizes_exist():
    assert set(ImageSize.objects.values_list("name", flat=True)) == {
        "large",
        "medium",
        "thumbnail",
    }


def test_seeding_again_changes_nothing():
    before = _counts()

    call_command("create_image_sizes", verbosity=0)
    call_command("seed_dev_data", verbosity=0)
    call_command("seed_changelogs", verbosity=0)

    assert _counts() == before
