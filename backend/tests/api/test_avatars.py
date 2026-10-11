import io

import pytest
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile

from tests.support import seed
from tests.support.factories import SentImageFactory, UserFactory
from tests.support.helpers.images import image_bytes, upload_file
from user_accounts.avatars import set_avatar
from user_core.models import User

pytestmark = pytest.mark.django_db

AVATAR_URL = "/api/accounts/me/avatar/"
MEDIA = "/api/media/avatars/"


def _media_path(username):
    name = User.objects.get(username=username).account.avatar.name
    return MEDIA + name.removeprefix("avatars/")


class TestUpload:
    def test_requires_authentication(self, client):
        response = client.put(AVATAR_URL, {"avatar": upload_file()}, format="multipart")

        assert response.status_code == 401

    def test_returns_me_with_the_new_avatar(self, client_as):
        user = UserFactory(is_active=True)

        response = client_as(user).put(
            AVATAR_URL, {"avatar": upload_file()}, format="multipart"
        )

        assert response.status_code == 200
        user.account.refresh_from_db()
        assert response.data["account"]["avatar"] == user.account.avatar.url

    def test_rejects_an_unsupported_format(self, client_as):
        response = client_as(UserFactory(is_active=True)).put(
            AVATAR_URL,
            {"avatar": upload_file(name="avatar.gif", fmt="GIF")},
            format="multipart",
        )

        assert response.status_code == 400

    def test_rejects_a_file_that_is_not_an_image(self, client_as):
        fake = SimpleUploadedFile("avatar.png", b"not an image", "image/png")

        response = client_as(UserFactory(is_active=True)).put(
            AVATAR_URL, {"avatar": fake}, format="multipart"
        )

        assert response.status_code == 400

    def test_rejects_a_file_over_the_limit(self, client_as, settings):
        settings.AVATAR_MAX_FILE_SIZE = 10

        response = client_as(UserFactory(is_active=True)).put(
            AVATAR_URL, {"avatar": upload_file()}, format="multipart"
        )

        assert response.status_code == 400

    def test_delete_clears_the_avatar(self, client_as):
        user = UserFactory(is_active=True)
        set_avatar(user.account, io.BytesIO(image_bytes()))

        response = client_as(user).delete(AVATAR_URL)

        assert response.status_code == 200
        assert response.data["account"]["avatar"] is None

    def test_patching_me_cannot_set_the_avatar(self, alice):
        before = User.objects.get(username=seed.ALICE).account.avatar.name

        alice.patch(
            "/api/auth/users/me/",
            {"account": {"avatar": "/api/media/avatars/other.jpg"}},
            format="json",
        )

        assert User.objects.get(username=seed.ALICE).account.avatar.name == before


class TestAccess:
    def test_requires_authentication(self, client):
        assert client.get(_media_path(seed.BOB)).status_code == 401

    def test_the_owner_may_fetch_it(self, alice):
        path = _media_path(seed.ALICE)

        response = alice.get(path)

        assert response.status_code == 200
        assert response["X-Accel-Redirect"] == (
            "/api/media/protected/avatars/" + path.removeprefix(MEDIA)
        )

    def test_a_friend_may_fetch_it(self, alice):
        assert alice.get(_media_path(seed.BOB)).status_code == 200

    def test_a_pending_request_is_enough(self, alice):
        assert alice.get(_media_path(seed.ERIN)).status_code == 200

    def test_a_sent_image_is_enough(self, client_as):
        stranger = UserFactory(is_active=True)
        SentImageFactory(
            sender=stranger, reciever=User.objects.get(username=seed.CAROL)
        )

        assert client_as(stranger).get(_media_path(seed.CAROL)).status_code == 200

    def test_an_unconnected_user_is_refused(self, client_for):
        dave = client_for(seed.DAVE)

        assert dave.get(_media_path(seed.CAROL)).status_code == 403

    def test_an_unknown_file_is_refused(self, alice):
        assert alice.get(MEDIA + "nothing-here.jpg").status_code == 403

    def test_staff_may_fetch_any(self, client_as):
        staff = UserFactory(is_active=True, is_staff=True)

        assert client_as(staff).get(_media_path(seed.CAROL)).status_code == 200


class TestPayloads:
    def test_friendships_carry_both_avatars(self, alice):
        response = alice.get("/api/friendships/")

        by_pair = {(f["sender"], f["reciever"]): f for f in response.data}
        with_bob = by_pair[(seed.ALICE, seed.BOB)]
        from_dave = by_pair[(seed.DAVE, seed.ALICE)]
        assert with_bob["reciever_avatar"].startswith(settings.MEDIA_URL + "avatars/")
        assert from_dave["sender_avatar"] is None

    def test_sent_images_carry_both_avatars(self, alice):
        response = alice.get("/api/sent-images/")

        item = response.data["results"][0]
        assert item["sender_avatar"].startswith(settings.MEDIA_URL + "avatars/")
        assert item["reciever_avatar"].startswith(settings.MEDIA_URL + "avatars/")
