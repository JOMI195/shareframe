from types import SimpleNamespace

import pytest
from django.contrib import admin
from django.contrib.messages import get_messages
from django.contrib.messages.storage.fallback import FallbackStorage
from django.core import mail
from django.test import RequestFactory

from changelogs.models import Changelog
from notifications.choices import NotificationChannel, NotificationKind
from notifications.models import ChannelSetting
from tests.support.factories import (
    ChangelogFactory,
    FrameFactory,
    FrameGroupFactory,
    UserFactory,
)
from tests.support.helpers.notifications import enable_channels

pytestmark = pytest.mark.django_db


@pytest.fixture
def model_admin():
    return admin.site._registry[Changelog]


@pytest.fixture
def staff():
    return UserFactory(is_active=True, is_staff=True, is_admin=True)


@pytest.fixture
def changelog():
    group = FrameGroupFactory()
    for _ in range(2):
        FrameFactory(user=UserFactory(is_active=True), groups=[group])
    return ChangelogFactory(groups=[group])


def admin_request(user, data=None):
    request = RequestFactory().post("/api/admin/changelogs/changelog/", data or {})
    request.user = user
    request.session = {}
    request._messages = FallbackStorage(request)
    return request


def selected(changelog):
    return Changelog.objects.filter(pk=changelog.pk)


class TestPublishTrigger:
    @pytest.fixture(autouse=True)
    def mail_enabled(self):
        enable_channels(NotificationKind.CHANGELOG, NotificationChannel.EMAIL)

    def save(self, model_admin, staff, changelog, capture):
        request = admin_request(staff)
        form = SimpleNamespace(instance=changelog, save_m2m=lambda: None)
        with capture(execute=True):
            model_admin.save_related(request, form, [], change=True)
        return [str(message) for message in get_messages(request)]

    def test_publishing_notifies_the_group_members(
        self, model_admin, staff, changelog, django_capture_on_commit_callbacks
    ):
        messages = self.save(
            model_admin, staff, changelog, django_capture_on_commit_callbacks
        )

        assert len(mail.outbox) == 2
        assert "queued for 2 recipients" in messages[0]
        changelog.refresh_from_db()
        assert changelog.notified_at is not None

    def test_saving_again_does_not_notify_twice(
        self, model_admin, staff, changelog, django_capture_on_commit_callbacks
    ):
        self.save(model_admin, staff, changelog, django_capture_on_commit_callbacks)
        mail.outbox.clear()

        messages = self.save(
            model_admin, staff, changelog, django_capture_on_commit_callbacks
        )

        assert mail.outbox == []
        assert messages == []

    def test_an_unpublished_changelog_is_not_sent(
        self, model_admin, staff, changelog, django_capture_on_commit_callbacks
    ):
        changelog.is_published = False
        changelog.save()

        self.save(model_admin, staff, changelog, django_capture_on_commit_callbacks)

        assert mail.outbox == []
        changelog.refresh_from_db()
        assert changelog.notified_at is None

    def test_without_an_enabled_channel_it_waits_and_warns(
        self, model_admin, staff, changelog, django_capture_on_commit_callbacks
    ):
        ChannelSetting.objects.update(enabled=False)

        messages = self.save(
            model_admin, staff, changelog, django_capture_on_commit_callbacks
        )

        assert mail.outbox == []
        assert "no channel enabled" in messages[0]
        changelog.refresh_from_db()
        assert changelog.notified_at is None

    def test_without_recipients_it_waits_and_warns(
        self, model_admin, staff, django_capture_on_commit_callbacks
    ):
        changelog = ChangelogFactory(groups=[FrameGroupFactory()])

        messages = self.save(
            model_admin, staff, changelog, django_capture_on_commit_callbacks
        )

        assert "no recipients" in messages[0]
        changelog.refresh_from_db()
        assert changelog.notified_at is None


def test_a_test_reaches_the_admin_notification_address(
    model_admin, staff, changelog, settings
):
    model_admin.send_test_to_me(admin_request(staff), selected(changelog))

    assert [message.to for message in mail.outbox] == [
        [settings.ADMIN_NOTIFICATION_EMAIL]
    ]
    changelog.refresh_from_db()
    assert changelog.notified_at is None


def test_a_test_for_non_admin_staff_reaches_their_own_address(model_admin, changelog):
    user = UserFactory(is_active=True, is_staff=True, is_admin=False)

    model_admin.send_test_to_me(admin_request(user), selected(changelog))

    assert [message.to for message in mail.outbox] == [[user.email]]
