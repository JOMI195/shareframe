import pytest
from rest_framework.exceptions import ValidationError

from images.models import Image
from images.serializers import ImagesValidationMixin
from tests.support import seed
from tests.support.factories import ImageFactory, UserFactory
from user_core.models import User

pytestmark = pytest.mark.django_db

validator = ImagesValidationMixin()


def test_a_user_below_the_limit_passes():
    assert validator.validate_user_image_count_limit(UserFactory())


def test_the_limit_counts_only_live_images(settings):
    user = UserFactory()
    settings.IMAGES_MAX_IMAGES_NUMBER = 1
    ImageFactory(user=user, markedAsDeleted=True)

    assert validator.validate_user_image_count_limit(user)


def test_a_user_at_the_limit_is_rejected(settings):
    user = UserFactory()
    settings.IMAGES_MAX_IMAGES_NUMBER = 1
    ImageFactory(user=user)

    with pytest.raises(ValidationError):
        validator.validate_user_image_count_limit(user)


def test_no_limit_permits_everything(settings):
    settings.IMAGES_MAX_IMAGES_NUMBER = None

    assert validator.validate_user_image_count_limit(UserFactory())


def test_the_seeded_library_is_within_the_limit(settings):
    alice = User.objects.get(username=seed.ALICE)

    assert (
        Image.objects.filter(user=alice, markedAsDeleted=False).count()
        < settings.IMAGES_MAX_IMAGES_NUMBER
    )
