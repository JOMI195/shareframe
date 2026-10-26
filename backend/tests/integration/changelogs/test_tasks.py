import json

import pytest
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile

from changelogs.models import ChangelogImage
from changelogs.tasks import notify_changelog, notify_changelog_test
from notifications.choices import NotificationChannel, NotificationKind
from notifications.models import Notification
from tests.support.factories import (
    ChangelogFactory,
    FrameFactory,
    FrameGroupFactory,
    UserFactory,
)
from tests.support.helpers.images import upload_file
from tests.support.helpers.mail import html_of
from tests.support.helpers.notifications import (
    enable_channels,
    set_preference,
    subscribe_push,
)

pytestmark = pytest.mark.django_db

KIND = NotificationKind.CHANGELOG
EMAIL = NotificationChannel.EMAIL
PUSH = NotificationChannel.PUSH


@pytest.fixture
def members():
    return [UserFactory(is_active=True) for _ in range(2)]


@pytest.fixture
def changelog(members):
    group = FrameGroupFactory()
    for member in members:
        FrameFactory(user=member, groups=[group])
    return ChangelogFactory(
        title="Power",
        groups=[group],
        content_file=SimpleUploadedFile("pwr.md", b"New **power** button.\n"),
    )


@pytest.fixture
def webpush(monkeypatch, settings):
    settings.VAPID_PRIVATE_KEY = "private"
    calls = []
    monkeypatch.setattr(
        "notifications.channels.push.webpush", lambda **kwargs: calls.append(kwargs)
    )
    return calls


def recipients():
    return sorted(to for message in mail.outbox for to in message.to)


class TestNotifyChangelog:
    def test_nothing_is_sent_while_no_channel_is_enabled(self, changelog):
        assert notify_changelog(changelog.id) == 0
        assert mail.outbox == []

    def test_every_member_gets_a_separate_mail(self, changelog, members):
        enable_channels(KIND, EMAIL)

        assert notify_changelog(changelog.id) == 2
        assert [len(message.to) for message in mail.outbox] == [1, 1]
        assert recipients() == sorted(member.email for member in members)

    def test_the_mail_carries_title_body_link_and_unsubscribe(
        self, changelog, settings
    ):
        enable_channels(KIND, EMAIL)

        notify_changelog(changelog.id)

        message = mail.outbox[-1]
        assert message.subject == "ShareFrame - Power"
        assert "<strong>power</strong>" in html_of(message)
        assert settings.FRONTEND_CHANGELOGS_URL in message.body
        assert settings.FRONTEND_UNSUBSCRIBE_URL in message.body
        assert "List-Unsubscribe" in message.extra_headers

    def test_referenced_images_are_attached_next_to_the_logo(self, members):
        enable_channels(KIND, EMAIL)
        group = FrameGroupFactory()
        FrameFactory(user=members[0], groups=[group])
        changelog = ChangelogFactory(
            groups=[group], content_file=SimpleUploadedFile("pwr.md", b"::pwr::\n")
        )
        image = ChangelogImage.objects.create(
            changelog=changelog, tag="pwr", image=upload_file()
        )

        notify_changelog(changelog.id)

        content_ids = [part["Content-ID"] for part in mail.outbox[-1].attachments]
        assert content_ids == ["<logo_image>", f"<changelog_image_{image.pk}>"]

    def test_a_member_who_turned_off_the_mail_is_skipped(self, changelog, members):
        enable_channels(KIND, EMAIL)
        set_preference(members[0].account, KIND, EMAIL, enabled=False)

        notify_changelog(changelog.id)

        assert recipients() == [members[1].email]

    def test_a_member_who_turned_off_changelogs_is_skipped(self, changelog, members):
        enable_channels(KIND, EMAIL)
        set_preference(members[0].account, KIND, enabled=False)

        notify_changelog(changelog.id)

        assert recipients() == [members[1].email]

    def test_push_points_to_the_changelogs(self, changelog, members, webpush, settings):
        enable_channels(KIND, PUSH)
        subscribe_push(members[0].account)

        notify_changelog(changelog.id)

        payload = json.loads(webpush[0]["data"])
        assert payload["title"] == "Power"
        assert payload["url"] == "/" + settings.FRONTEND_CHANGELOGS_URL
        assert Notification.objects.filter(
            account=members[0].account, kind=KIND, channel=PUSH
        ).exists()


class TestSendChangelogTest:
    @pytest.fixture
    def staff(self):
        return UserFactory(is_active=True, is_staff=True, is_admin=True)

    def test_reaches_the_admin_address_while_channels_are_off(
        self, changelog, staff, settings
    ):
        assert notify_changelog_test(changelog.id, staff.id) == [EMAIL]
        assert [message.to for message in mail.outbox] == [
            [settings.ADMIN_NOTIFICATION_EMAIL]
        ]

    def test_non_admin_staff_get_it_on_their_own_address(self, changelog):
        user = UserFactory(is_active=True, is_staff=True, is_admin=False)

        notify_changelog_test(changelog.id, user.id)

        assert [message.to for message in mail.outbox] == [[user.email]]

    def test_ignores_own_opt_outs_and_is_not_logged(self, changelog, staff):
        set_preference(staff.account, KIND, enabled=False)

        notify_changelog_test(changelog.id, staff.id)

        assert len(mail.outbox) == 1
        assert not Notification.objects.filter(account=staff.account).exists()

    def test_has_no_unsubscribe_link(self, changelog, staff, settings):
        notify_changelog_test(changelog.id, staff.id)

        message = mail.outbox[-1]
        assert settings.FRONTEND_UNSUBSCRIBE_URL not in message.body
        assert settings.FRONTEND_NOTIFICATION_SETTINGS_URL in message.body
        assert "List-Unsubscribe" not in message.extra_headers
        assert "List-Unsubscribe-Post" not in message.extra_headers

    def test_reaches_the_admins_push_devices(self, changelog, staff, webpush):
        subscribe_push(staff.account)

        assert notify_changelog_test(changelog.id, staff.id) == [PUSH, EMAIL]
        assert len(webpush) == 1
