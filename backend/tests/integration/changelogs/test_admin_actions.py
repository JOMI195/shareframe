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


class TestNotifyGroupMembers:
    @pytest.fixture(autouse=True)
    def mail_enabled(self):
        enable_channels(NotificationKind.CHANGELOG, NotificationChannel.EMAIL)

    def notify(self, model_admin, staff, changelog, apply=True):
        request = admin_request(staff, {"apply": "yes"} if apply else None)
        response = model_admin.notify_group_members(request, selected(changelog))
        return response, [str(message) for message in get_messages(request)]

    def test_saving_does_not_notify(
        self, model_admin, staff, changelog, django_capture_on_commit_callbacks
    ):
        request = admin_request(staff)
        form = SimpleNamespace(instance=changelog, save_m2m=lambda: None)
        with django_capture_on_commit_callbacks(execute=True):
            model_admin.save_related(request, form, [], change=True)

        assert mail.outbox == []
        changelog.refresh_from_db()
        assert changelog.notified_at is None

    def test_asks_for_confirmation_first(self, model_admin, staff, changelog):
        response, _ = self.notify(model_admin, staff, changelog, apply=False)

        assert response.template_name == "admin/changelogs/confirm_notify.html"
        assert response.context_data["notifiable"] == [(changelog, 2)]
        assert mail.outbox == []
        changelog.refresh_from_db()
        assert changelog.notified_at is None

    def test_a_row_click_asks_for_confirmation_for_that_changelog(
        self, model_admin, staff, changelog
    ):
        ChangelogFactory(groups=changelog.groups.all())

        response = model_admin.notify_members(admin_request(staff), changelog)

        assert response.template_name == "admin/changelogs/confirm_notify.html"
        assert response.context_data["notifiable"] == [(changelog, 2)]
        assert mail.outbox == []

    def test_confirming_notifies_the_group_members(self, model_admin, staff, changelog):
        _, messages = self.notify(model_admin, staff, changelog)

        assert len(mail.outbox) == 2
        assert "queued for 2 recipients" in messages[0]
        changelog.refresh_from_db()
        assert changelog.notified_at is not None

    def test_groups_added_before_notifying_are_included(
        self, model_admin, staff, changelog
    ):
        group = FrameGroupFactory()
        FrameFactory(user=UserFactory(is_active=True), groups=[group])
        changelog.groups.add(group)

        self.notify(model_admin, staff, changelog)

        assert len(mail.outbox) == 3

    def test_notifying_again_is_skipped(self, model_admin, staff, changelog):
        self.notify(model_admin, staff, changelog)
        mail.outbox.clear()

        response, messages = self.notify(model_admin, staff, changelog, apply=False)

        assert response is None
        assert mail.outbox == []
        assert "already notified" in messages[0]

    def test_an_unpublished_changelog_is_skipped(self, model_admin, staff, changelog):
        changelog.is_published = False
        changelog.save()

        _, messages = self.notify(model_admin, staff, changelog)

        assert mail.outbox == []
        assert "not published" in messages[0]
        changelog.refresh_from_db()
        assert changelog.notified_at is None

    def test_without_an_enabled_channel_it_is_skipped(
        self, model_admin, staff, changelog
    ):
        ChannelSetting.objects.update(enabled=False)

        _, messages = self.notify(model_admin, staff, changelog)

        assert mail.outbox == []
        assert "no channel enabled" in messages[0]
        changelog.refresh_from_db()
        assert changelog.notified_at is None

    def test_without_recipients_it_is_skipped(self, model_admin, staff):
        changelog = ChangelogFactory(groups=[FrameGroupFactory()])

        _, messages = self.notify(model_admin, staff, changelog)

        assert "no recipients" in messages[0]
        changelog.refresh_from_db()
        assert changelog.notified_at is None


def test_a_test_reaches_the_admin_notification_address(
    model_admin, staff, changelog, settings
):
    model_admin.notify_me_as_test(admin_request(staff), selected(changelog))

    assert [message.to for message in mail.outbox] == [
        [settings.ADMIN_NOTIFICATION_EMAIL]
    ]
    changelog.refresh_from_db()
    assert changelog.notified_at is None


def test_a_test_for_non_admin_staff_reaches_their_own_address(model_admin, changelog):
    user = UserFactory(is_active=True, is_staff=True, is_admin=False)

    model_admin.notify_me_as_test(admin_request(user), selected(changelog))

    assert [message.to for message in mail.outbox] == [[user.email]]


def test_a_row_click_notifies_me_as_test(model_admin, staff, changelog, settings):
    model_admin.notify_test(admin_request(staff), changelog)

    assert [message.to for message in mail.outbox] == [
        [settings.ADMIN_NOTIFICATION_EMAIL]
    ]
