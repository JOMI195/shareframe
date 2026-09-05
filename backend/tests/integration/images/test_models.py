import os

import pytest
from django.utils import timezone
from freezegun import freeze_time

from images.models import Image, ImageVariant
from tests.support import seed
from tests.support.factories import ImageFactory
from tests.support.helpers.images import upload_file
from user_core.models import User

pytestmark = pytest.mark.django_db


@pytest.fixture
def alice_image():
    return Image.objects.filter(user__username=seed.ALICE).first()


def test_seeding_generated_every_variant(alice_image):
    assert set(alice_image.variants.values_list("image_size__name", flat=True)) == {
        "large",
        "medium",
        "thumbnail",
    }


def test_metadata_is_stored_on_save():
    image = ImageFactory(image=upload_file(size=(120, 90)))

    assert (image.width, image.height) == (120, 90)
    assert image.format == "PNG"
    assert image.size > 0


def test_the_name_falls_back_to_the_generated_one():
    image = ImageFactory(display_name="")

    assert image.display_name == f"image_{image.id}"


def test_uploads_land_under_the_private_prefix():
    image = ImageFactory()

    assert image.image.name.startswith(os.path.join("private", "images"))


def test_a_jpeg_source_yields_jpeg_variants():
    image = ImageFactory(image=upload_file(name="photo.jpg", fmt="JPEG"))

    from PIL import Image as PILImage

    assert PILImage.open(image.get_variant("medium")).format == "JPEG"


def test_get_variant_returns_none_for_an_unknown_size(alice_image):
    assert alice_image.get_variant("gigantic") is None


class TestDeliveryFile:
    def test_prefers_the_large_variant(self, alice_image):
        assert alice_image.get_delivery_file() == alice_image.get_variant("large")

    def test_falls_back_to_medium(self, alice_image):
        alice_image.variants.filter(image_size__name="large").delete()

        assert alice_image.get_delivery_file() == alice_image.get_variant("medium")

    def test_falls_back_to_the_original(self, alice_image):
        alice_image.variants.all().delete()

        assert alice_image.get_delivery_file() == alice_image.image


class TestAutoDelete:
    def test_an_image_without_the_flag_is_never_auto_deleted(self):
        assert not ImageFactory(auto_delete_after_period=False).should_be_auto_deleted()

    def test_a_fresh_image_is_not_yet_due(self):
        assert not ImageFactory(auto_delete_after_period=True).should_be_auto_deleted()

    def test_it_is_due_once_the_interval_has_passed(self, settings):
        image = ImageFactory(auto_delete_after_period=True)
        later = timezone.now() + timezone.timedelta(
            hours=settings.IMAGES_AUTO_DELETE_INTERVAL_HOURS, minutes=1
        )

        with freeze_time(later):
            assert image.should_be_auto_deleted()

    def test_an_already_marked_image_is_not_due_again(self, settings):
        image = ImageFactory(auto_delete_after_period=True, markedAsDeleted=True)
        later = timezone.now() + timezone.timedelta(
            hours=settings.IMAGES_AUTO_DELETE_INTERVAL_HOURS, minutes=1
        )

        with freeze_time(later):
            assert not image.should_be_auto_deleted()


class TestDelete:
    def test_removes_the_original_and_every_variant_file(self):
        image = ImageFactory()
        paths = [image.image.path] + [v.file.path for v in image.variants.all()]

        image.delete()

        assert not any(os.path.exists(path) for path in paths)

    def test_removes_the_variant_rows(self):
        image = ImageFactory()

        image.delete()

        assert not ImageVariant.objects.filter(parent_image_id=image.id).exists()


def test_variants_are_unique_per_size(alice_image):
    from django.db import IntegrityError

    size = alice_image.variants.first().image_size

    with pytest.raises(IntegrityError):
        ImageVariant.objects.create(parent_image=alice_image, image_size=size)


def test_deleting_a_user_takes_their_images(alice_image):
    user = User.objects.get(username=seed.ALICE)
    image_id = alice_image.id

    Image.objects.filter(user=user).delete()

    assert not Image.objects.filter(id=image_id).exists()
