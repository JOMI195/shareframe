import pytest
from django.core.files.base import ContentFile

from changelogs.models import Changelog, ChangelogImage
from frames.models import Frame, FrameGroup
from tests.support import seed
from tests.support.factories import ChangelogFactory, FrameGroupFactory
from tests.support.helpers.images import upload_file

pytestmark = pytest.mark.django_db

IDS_URL = "/api/changelogs/ids/"
BY_IDS_URL = "/api/changelogs/by-ids/"


def alice_groups():
    return FrameGroup.objects.filter(frames__user__username=seed.ALICE).distinct()


def test_requires_authentication(client):
    assert client.get(IDS_URL).status_code == 401


class TestListIds:
    def test_lists_the_changelogs_for_the_users_frame_groups(self, alice):
        response = alice.get(IDS_URL)

        assert response.status_code == 200
        expected = Changelog.objects.filter(
            is_published=True, groups__in=alice_groups()
        ).distinct()
        assert {entry["id"] for entry in response.data} == set(
            expected.values_list("id", flat=True)
        )

    def test_the_payload_is_only_the_index_fields(self, alice):
        entry = alice.get(IDS_URL).data[0]

        assert set(entry) == {"id", "date", "title", "is_published"}

    def test_unpublished_changelogs_are_hidden(self, alice):
        hidden = ChangelogFactory(is_published=False, groups=list(alice_groups()))

        assert hidden.id not in {entry["id"] for entry in alice.get(IDS_URL).data}

    def test_a_changelog_for_another_group_is_hidden(self, alice):
        other = ChangelogFactory(groups=[FrameGroupFactory()])

        assert other.id not in {entry["id"] for entry in alice.get(IDS_URL).data}

    def test_a_user_without_frames_sees_nothing(self, alice):
        Frame.objects.filter(user__username=seed.ALICE).update(user=None)

        assert alice.get(IDS_URL).data == []

    def test_a_deactivated_frame_does_not_count(self, alice):
        Frame.objects.filter(user__username=seed.ALICE).update(is_active=False)

        assert alice.get(IDS_URL).data == []


class TestGetByIds:
    def test_returns_the_bodies(self, alice):
        ids = [entry["id"] for entry in alice.get(IDS_URL).data]

        response = alice.post(BY_IDS_URL, {"ids": ids}, format="json")

        assert response.status_code == 200
        assert all(entry["content"] for entry in response.data)

    def test_an_empty_list_is_a_bad_request(self, alice):
        assert alice.post(BY_IDS_URL, {"ids": []}, format="json").status_code == 400

    def test_a_missing_ids_field_is_a_bad_request(self, alice):
        assert alice.post(BY_IDS_URL, {}, format="json").status_code == 400

    def test_a_non_list_is_a_bad_request(self, alice):
        assert alice.post(BY_IDS_URL, {"ids": "3"}, format="json").status_code == 400

    def test_ids_outside_the_users_groups_are_not_found(self, alice):
        other = ChangelogFactory(groups=[FrameGroupFactory()])

        response = alice.post(BY_IDS_URL, {"ids": [other.id]}, format="json")

        assert response.status_code == 404

    def test_image_placeholders_are_replaced_with_urls(self, alice):
        changelog = ChangelogFactory(groups=list(alice_groups()))
        changelog.content_file.save("notes.md", ContentFile(b"Before ::hero:: after"))
        ChangelogImage.objects.create(
            changelog=changelog, tag="hero", description="A hero", image=upload_file()
        )

        response = alice.post(BY_IDS_URL, {"ids": [changelog.id]}, format="json")

        assert "::hero::" not in response.data[0]["content"]
        assert "![A hero](" in response.data[0]["content"]
