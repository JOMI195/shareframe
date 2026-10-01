import os

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from changelogs.email import render_email_html
from changelogs.models import ChangelogImage
from tests.support.factories import (
    ChangelogFactory,
    FrameFactory,
    FrameGroupFactory,
    UserFactory,
)
from tests.support.helpers.images import upload_file

pytestmark = pytest.mark.django_db


def changelog_with(body):
    return ChangelogFactory(content_file=SimpleUploadedFile("pwr.md", body.encode()))


def attach(changelog, tag, description=""):
    return ChangelogImage.objects.create(
        changelog=changelog, tag=tag, description=description, image=upload_file()
    )


class TestRenderEmailHtml:
    def test_a_placeholder_becomes_an_inline_image(self):
        changelog = changelog_with("## Power\n\n::pwr::\n")
        image = attach(changelog, "pwr", "Power button")

        html, images = render_email_html(changelog)

        cid = f"changelog_image_{image.pk}"
        assert f'src="cid:{cid}"' in html
        assert 'alt="Power button"' in html
        assert images == [
            {
                "path": image.image.path,
                "cid": cid,
                "template_identifier": cid,
                "filename": os.path.basename(image.image.name),
            }
        ]

    def test_an_unreferenced_image_is_not_attached(self):
        changelog = changelog_with("No pictures.\n")
        attach(changelog, "unused")

        _, images = render_email_html(changelog)

        assert images == []

    def test_elements_carry_inline_styles(self):
        changelog = changelog_with(
            "## Title\n\nSee [docs](https://example.test).\n\n- item\n"
        )

        html, _ = render_email_html(changelog)

        assert '<h2 style="' in html
        assert '<p style="' in html
        assert '<li style="' in html
        assert 'style="color: #8b5cf6;' in html


class TestRecipients:
    @pytest.fixture
    def group(self):
        return FrameGroupFactory()

    def member(self, group, frame_active=True, **kwargs):
        user = UserFactory(is_active=True, **kwargs)
        FrameFactory(user=user, groups=[group], is_active=frame_active)
        return user

    def test_owners_of_active_frames_in_the_groups_are_included(self, group):
        user = self.member(group)

        assert list(ChangelogFactory(groups=[group]).recipients()) == [user]

    def test_a_user_with_two_frames_is_listed_once(self, group):
        user = self.member(group)
        FrameFactory(user=user, groups=[group])

        assert list(ChangelogFactory(groups=[group]).recipients()) == [user]

    def test_inactive_and_deleted_accounts_are_excluded(self, group):
        self.member(group, is_deleted=True)
        FrameFactory(user=UserFactory(is_active=False), groups=[group])

        assert not ChangelogFactory(groups=[group]).recipients().exists()

    def test_owners_of_inactive_frames_are_excluded(self, group):
        self.member(group, frame_active=False)

        assert not ChangelogFactory(groups=[group]).recipients().exists()

    def test_frames_in_other_groups_are_excluded(self, group):
        self.member(FrameGroupFactory())

        assert not ChangelogFactory(groups=[group]).recipients().exists()
