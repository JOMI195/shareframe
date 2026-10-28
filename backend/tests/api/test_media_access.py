import os

import pytest

from changelogs.models import ChangelogImage
from frames.models import Frame, FrameGroup
from images.models import Image
from sent_images.models import SentImage, SentImageStatus
from tests.support import seed
from tests.support.factories import (
    ChangelogFactory,
    FrameGroupFactory,
    FrameTokenFactory,
    ReleaseFactory,
    SentImageFactory,
    UserFactory,
)
from tests.support.helpers.frames import token_headers
from tests.support.helpers.images import upload_file
from user_core.models import User

pytestmark = pytest.mark.django_db

PRIVATE = "/api/media/private/"
UPDATES = "/api/media/frame-updates/"
CHANGELOGS = "/api/media/changelogs/"


def media_path(field):
    from django.conf import settings

    return field.url.replace(settings.MEDIA_URL + "private/", "")


class TestPrivateMedia:
    def test_requires_authentication(self, client):
        assert client.get(PRIVATE + "images/whatever.png").status_code == 401

    def test_the_owner_may_fetch_their_original(self, alice):
        image = Image.objects.filter(user__username=seed.ALICE).first()

        response = alice.get(PRIVATE + media_path(image.image))

        assert response.status_code == 200
        assert response["X-Accel-Redirect"].endswith(media_path(image.image))

    def test_the_owner_may_fetch_a_variant(self, alice):
        variant = (
            Image.objects.filter(user__username=seed.ALICE).first().variants.first()
        )

        response = alice.get(PRIVATE + media_path(variant.file))

        assert response.status_code == 200

    def test_another_users_image_is_refused(self, alice):
        theirs = Image.objects.filter(user__username=seed.BOB).first()
        SentImage.objects.filter(image=theirs).delete()

        assert alice.get(PRIVATE + media_path(theirs.image)).status_code == 403

    def test_an_image_that_was_sent_to_you_is_allowed(self, alice):
        alice_user = User.objects.get(username=seed.ALICE)
        sent = SentImageFactory(reciever=alice_user)

        response = alice.get(PRIVATE + media_path(sent.image.image))

        assert response.status_code == 200

    def test_an_unknown_path_is_refused(self, alice):
        assert alice.get(PRIVATE + "images/nothing-here.png").status_code == 403

    def test_a_scheduled_image_is_not_yet_visible_to_the_recipient(self, alice):
        alice_user = User.objects.get(username=seed.ALICE)
        sent = SentImageFactory(reciever=alice_user, status=SentImageStatus.SCHEDULED)

        assert alice.get(PRIVATE + media_path(sent.image.image)).status_code == 403

    def test_the_browser_must_revalidate_every_view(self, alice):
        image = Image.objects.filter(user__username=seed.ALICE).first()

        response = alice.get(PRIVATE + media_path(image.image))

        assert response["Cache-Control"] == "private, no-cache"

    @pytest.mark.parametrize(
        "template",
        [
            "images/../{}",
            "images/./{}",
            "images/%2e%2e/{}",
            "images//{}",
            "/{}",
            "images\\..\\{}",
        ],
    )
    def test_a_path_that_could_escape_is_refused(self, alice, template):
        own = media_path(Image.objects.filter(user__username=seed.ALICE).first().image)

        assert alice.get(PRIVATE + template.format(own)).status_code == 403

    def test_staff_get_no_access_to_other_users_images(self, client_as):
        staff = UserFactory(is_active=True, is_staff=True, is_admin=True)
        theirs = Image.objects.filter(user__username=seed.BOB).first()

        response = client_as(staff).get(PRIVATE + media_path(theirs.image))

        assert response.status_code == 403

    def test_staff_may_fetch_an_image_sent_to_them(self, client_as):
        staff = UserFactory(is_active=True, is_staff=True, is_admin=True)
        sent = SentImageFactory(reciever=staff)

        response = client_as(staff).get(PRIVATE + media_path(sent.image.image))

        assert response.status_code == 200


class TestFrameUpdatesMedia:
    @pytest.fixture
    def frame(self):
        return Frame.objects.get(private_serial_number="SEED-PRIVATE-0003")

    def test_a_frame_token_is_required(self, client):
        assert client.get(UPDATES + "firmware.bin").status_code == 403

    def test_a_frame_in_the_group_may_download(self, client, frame):
        release = ReleaseFactory(groups=[frame.groups.first()])
        token = FrameTokenFactory(frame=frame)

        response = client.get(
            UPDATES + os.path.basename(release.file.name),
            headers=token_headers(token.access_token),
        )

        assert response.status_code == 200
        assert response["X-Accel-Redirect"] == (
            "/api/media/protected/" + release.file.name
        )
        assert "Cache-Control" not in response

    def test_a_traversal_with_a_matching_file_name_is_refused(self, client, frame):
        release = ReleaseFactory(groups=[frame.groups.first()])
        token = FrameTokenFactory(frame=frame)

        response = client.get(
            UPDATES + "../private/images/" + os.path.basename(release.file.name),
            headers=token_headers(token.access_token),
        )

        assert response.status_code == 403

    def test_a_granted_download_records_the_update_attempt(self, client, frame):
        release = ReleaseFactory(groups=[frame.groups.first()])
        token = FrameTokenFactory(frame=frame)

        client.get(
            UPDATES + os.path.basename(release.file.name),
            headers=token_headers(token.access_token),
        )

        frame.refresh_from_db()
        assert frame.last_update_attempt is not None

    def test_a_release_for_another_group_is_refused(self, client, frame):
        release = ReleaseFactory(groups=[FrameGroupFactory()])
        token = FrameTokenFactory(frame=frame)

        response = client.get(
            UPDATES + os.path.basename(release.file.name),
            headers=token_headers(token.access_token),
        )

        assert response.status_code == 403
        frame.refresh_from_db()
        assert frame.last_update_attempt is None

    def test_an_inactive_release_is_refused(self, client, frame):
        release = ReleaseFactory(groups=[frame.groups.first()], is_active=False)
        token = FrameTokenFactory(frame=frame)

        response = client.get(
            UPDATES + os.path.basename(release.file.name),
            headers=token_headers(token.access_token),
        )

        assert response.status_code == 403

    def test_a_frame_without_groups_is_refused(self, client, frame):
        release = ReleaseFactory(groups=[frame.groups.first()])
        frame.groups.clear()
        token = FrameTokenFactory(frame=frame)

        response = client.get(
            UPDATES + os.path.basename(release.file.name),
            headers=token_headers(token.access_token),
        )

        assert response.status_code == 403


def changelog_path(changelog_image):
    return changelog_image.image.name.removeprefix("changelogs/")


class TestChangelogMedia:
    def alice_group(self):
        return FrameGroup.objects.filter(frames__user__username=seed.ALICE).first()

    def attach(self, changelog):
        return ChangelogImage.objects.create(
            changelog=changelog, tag="hero", image=upload_file()
        )

    def test_requires_authentication(self, client):
        assert client.get(CHANGELOGS + "images/x.png").status_code == 401

    def test_an_image_of_a_changelog_in_the_users_group_is_allowed(self, alice):
        image = self.attach(ChangelogFactory(groups=[self.alice_group()]))

        response = alice.get(CHANGELOGS + changelog_path(image))

        assert response.status_code == 200
        assert response["X-Accel-Redirect"] == (
            "/api/media/protected/" + image.image.name
        )
        assert response["Cache-Control"] == "private, no-cache"

    def test_a_traversal_with_a_matching_file_name_is_refused(self, alice):
        image = self.attach(ChangelogFactory(groups=[self.alice_group()]))

        response = alice.get(
            CHANGELOGS + "../private/images/" + os.path.basename(image.image.name)
        )

        assert response.status_code == 403

    def test_the_bare_file_name_is_not_a_valid_path(self, alice):
        image = self.attach(ChangelogFactory(groups=[self.alice_group()]))

        response = alice.get(CHANGELOGS + os.path.basename(image.image.name))

        assert response.status_code == 403

    def test_a_changelog_without_groups_is_public_to_frame_owners(self, alice):
        image = self.attach(ChangelogFactory())

        assert alice.get(CHANGELOGS + changelog_path(image)).status_code == 200

    def test_a_changelog_for_another_group_is_refused(self, alice):
        image = self.attach(ChangelogFactory(groups=[FrameGroupFactory()]))

        assert alice.get(CHANGELOGS + changelog_path(image)).status_code == 403

    def test_an_unpublished_changelog_is_refused(self, alice):
        image = self.attach(
            ChangelogFactory(is_published=False, groups=[self.alice_group()])
        )

        assert alice.get(CHANGELOGS + changelog_path(image)).status_code == 403

    def test_a_user_without_frames_is_refused(self, alice):
        image = self.attach(ChangelogFactory(groups=[self.alice_group()]))
        Frame.objects.filter(user__username=seed.ALICE).update(user=None)

        assert alice.get(CHANGELOGS + changelog_path(image)).status_code == 403

    def test_an_unknown_file_is_refused(self, alice):
        assert alice.get(CHANGELOGS + "images/nothing.png").status_code == 403
