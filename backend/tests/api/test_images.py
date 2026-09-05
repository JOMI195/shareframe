import pytest

from images.models import Image
from tests.support import seed
from tests.support.factories import ImageFactory
from tests.support.helpers.images import upload_file, upload_with_checksum
from user_core.models import User

pytestmark = pytest.mark.django_db

URL = "/api/images/"
PAGE_SIZE = 10


def upload(client, **overrides):
    image, checksum = upload_with_checksum()
    payload = {
        "image": image,
        "upload_image_sha256_hex_hash": checksum,
        "auto_delete_after_period": "false",
        **overrides,
    }
    return client.post(URL, payload, format="multipart")


def test_requires_authentication(client):
    assert client.get(URL).status_code == 401


class TestList:
    def test_returns_the_first_page(self, alice):
        response = alice.get(URL)

        assert response.status_code == 200
        assert response.data["count"] == len(seed.images_of(seed.ALICE))
        assert len(response.data["results"]) == PAGE_SIZE

    def test_the_second_page_holds_the_rest(self, alice):
        response = alice.get(URL, {"page": 2})

        assert len(response.data["results"]) == len(seed.images_of(seed.ALICE)) - PAGE_SIZE

    def test_the_page_size_can_be_changed(self, alice):
        response = alice.get(URL, {"page_size": 3})

        assert len(response.data["results"]) == 3

    def test_only_the_users_own_images_are_listed(self, bob):
        response = bob.get(URL)

        assert response.data["count"] == len(seed.images_of(seed.BOB))

    def test_soft_deleted_images_are_hidden(self, alice):
        before = alice.get(URL).data["count"]
        image = Image.objects.filter(user__username=seed.ALICE).first()
        image.markedAsDeleted = True
        image.save(update_fields_only=True)

        assert alice.get(URL).data["count"] == before - 1

    def test_every_variant_is_reported(self, alice):
        first = alice.get(URL).data["results"][0]

        assert {variant["size_name"] for variant in first["variants"]} == {
            "large",
            "medium",
            "thumbnail",
        }


class TestCreate:
    def test_uploads_an_image(self, alice):
        response = upload(alice)

        assert response.status_code == 201
        assert response.data["variants"]

    def test_the_upload_belongs_to_the_caller(self, alice):
        response = upload(alice)

        assert Image.objects.get(pk=response.data["id"]).user.username == seed.ALICE

    def test_the_auto_delete_flag_is_honoured(self, alice):
        response = upload(alice, auto_delete_after_period="true")

        assert response.data["auto_delete_after_period"] is True

    def test_a_wrong_checksum_is_rejected(self, alice):
        response = alice.post(
            URL,
            {
                "image": upload_file(),
                "upload_image_sha256_hex_hash": "0" * 64,
                "auto_delete_after_period": "false",
            },
            format="multipart",
        )

        assert response.status_code == 400

    def test_an_unsupported_format_is_rejected(self, alice):
        image, checksum = upload_with_checksum(name="animation.gif")

        response = alice.post(
            URL,
            {
                "image": image,
                "upload_image_sha256_hex_hash": checksum,
                "auto_delete_after_period": "false",
            },
            format="multipart",
        )

        assert response.status_code == 400

    def test_the_library_limit_is_enforced(self, alice, settings):
        settings.IMAGES_MAX_IMAGES_NUMBER = len(seed.images_of(seed.ALICE))

        assert upload(alice).status_code == 400

    def test_the_upload_needs_the_csrf_header(self, alice):
        alice.cookies.pop("csrftoken")

        assert upload(alice).status_code == 403


class TestRetrieve:
    def test_returns_the_users_own_image(self, alice):
        image = Image.objects.filter(user__username=seed.ALICE).first()

        response = alice.get(f"{URL}{image.pk}/")

        assert response.status_code == 200
        assert response.data["id"] == image.pk

    def test_another_users_image_is_not_found(self, alice):
        theirs = Image.objects.filter(user__username=seed.BOB).first()

        assert alice.get(f"{URL}{theirs.pk}/").status_code == 404

    def test_an_unknown_id_is_not_found(self, alice):
        assert alice.get(f"{URL}999999/").status_code == 404


class TestDestroy:
    def test_deleting_only_marks_the_image(self, alice):
        image = ImageFactory(user=User.objects.get(username=seed.ALICE))

        response = alice.delete(f"{URL}{image.pk}/")

        assert response.status_code == 200
        image.refresh_from_db()
        assert image.markedAsDeleted
        assert Image.objects.filter(pk=image.pk).exists()

    def test_another_users_image_cannot_be_deleted(self, alice):
        theirs = Image.objects.filter(user__username=seed.BOB).first()

        assert alice.delete(f"{URL}{theirs.pk}/").status_code == 404
        theirs.refresh_from_db()
        assert not theirs.markedAsDeleted

    def test_deleting_twice_is_not_found(self, alice):
        image = ImageFactory(user=User.objects.get(username=seed.ALICE))
        alice.delete(f"{URL}{image.pk}/")

        assert alice.delete(f"{URL}{image.pk}/").status_code == 404


@pytest.mark.parametrize("method", ["put", "patch"])
def test_updating_is_not_allowed(alice, method):
    image = Image.objects.filter(user__username=seed.ALICE).first()

    response = getattr(alice, method)(f"{URL}{image.pk}/", {}, format="multipart")

    assert response.status_code == 405
