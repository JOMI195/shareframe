import pytest
from django.contrib import admin
from django.contrib.messages import get_messages
from django.contrib.messages.storage.fallback import FallbackStorage
from django.core import mail
from django.test import RequestFactory

from changelogs.models import Changelog
from tests.support.factories import (
    ChangelogFactory,
    FrameFactory,
    FrameGroupFactory,
    UserFactory,
)

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


class TestSendToGroupMembers:
    def test_asks_for_confirmation_first(self, model_admin, staff, changelog):
        response = model_admin.send_email_to_group_members(
            admin_request(staff), selected(changelog)
        )

        assert "2 recipients" in response.render().content.decode()
        assert mail.outbox == []
        changelog.refresh_from_db()
        assert changelog.email_sent_at is None

    def test_sends_after_confirmation(self, model_admin, staff, changelog):
        model_admin.send_email_to_group_members(
            admin_request(staff, {"apply": "yes"}), selected(changelog)
        )

        assert len(mail.outbox) == 2
        changelog.refresh_from_db()
        assert changelog.email_sent_at is not None

    def test_a_sent_changelog_is_not_sent_again(self, model_admin, staff, changelog):
        model_admin.send_email_to_group_members(
            admin_request(staff, {"apply": "yes"}), selected(changelog)
        )
        mail.outbox.clear()
        request = admin_request(staff)

        response = model_admin.send_email_to_group_members(request, selected(changelog))

        assert response is None
        assert mail.outbox == []
        assert "already sent" in str(list(get_messages(request))[0])

    def test_an_unpublished_changelog_is_skipped(self, model_admin, staff, changelog):
        changelog.is_published = False
        changelog.save()

        model_admin.send_email_to_group_members(
            admin_request(staff, {"apply": "yes"}), selected(changelog)
        )

        assert mail.outbox == []


def test_a_test_mail_only_reaches_the_admin(model_admin, staff, changelog):
    model_admin.send_test_email(admin_request(staff), selected(changelog))

    assert [message.to for message in mail.outbox] == [[staff.email]]
    changelog.refresh_from_db()
    assert changelog.email_sent_at is None
