import pytest
from django.contrib.auth.signals import user_logged_in, user_login_failed
from django.core import mail
from django.test import RequestFactory

from tests.support import seed
from tests.support.factories import UserFactory
from user_core.models import User

pytestmark = pytest.mark.django_db


@pytest.fixture
def alice_user():
    return User.objects.get(username=seed.ALICE)


def login(user, request=None):
    user_logged_in.send(sender=None, request=request or RequestFactory().get("/"), user=user)
    return mail.outbox[-1]


def failed(email, path="/api/auth/jwt/create/"):
    user_login_failed.send(
        sender=None,
        credentials={"email": email},
        request=RequestFactory().post(path, REMOTE_ADDR="203.0.113.5"),
    )


class TestLogin:
    def test_notifies_the_user(self, alice_user):
        message = login(alice_user)

        assert message.to == [alice_user.email]
        assert message.subject == "ShareFrame Login"

    def test_an_admin_login_goes_to_the_admin_address(self, settings):
        admin = UserFactory(is_admin=True)

        message = login(admin)

        assert message.to == [settings.ADMIN_NOTIFICATION_EMAIL]
        assert message.subject == "ShareFrame Admin Login"

    def test_the_client_ip_is_reported(self, alice_user):
        request = RequestFactory().get("/", HTTP_X_FORWARDED_FOR="198.51.100.7, 10.0.0.1")

        message = login(alice_user, request)

        assert "198.51.100.7" in message.body


class TestFailedLogin:
    def test_warns_the_owner_of_a_real_account(self, alice_user):
        failed(alice_user.email)

        assert mail.outbox[-1].to == [alice_user.email]
        assert "Fehlgeschlagener Login-Versuch" in mail.outbox[-1].subject

    def test_an_unknown_address_is_not_mailed(self):
        before = len(mail.outbox)

        failed("nobody@shareframe.local")

        assert len(mail.outbox) == before

    def test_a_deleted_account_is_not_mailed(self):
        user = UserFactory()
        email = user.email
        user.delete()
        before = len(mail.outbox)

        failed(email)

        assert len(mail.outbox) == before

    def test_an_admin_attempt_goes_to_the_admin_address(self, settings):
        failed("whoever@shareframe.local", path="/api/admin/login/")

        assert mail.outbox[-1].to == [settings.ADMIN_NOTIFICATION_EMAIL]
        assert "Admin" in mail.outbox[-1].subject

    def test_the_attempted_address_is_reported(self, alice_user):
        failed(alice_user.email)

        assert alice_user.email in mail.outbox[-1].body


def test_an_admin_action_is_logged(caplog, alice_user):
    from django.contrib.admin.models import ADDITION, LogEntry
    from django.contrib.contenttypes.models import ContentType

    with caplog.at_level("INFO", logger="admin.audit"):
        LogEntry.objects.create(
            user=alice_user,
            content_type=ContentType.objects.get_for_model(User),
            object_id=alice_user.pk,
            object_repr=str(alice_user),
            action_flag=ADDITION,
        )

    assert "Admin CREATE" in caplog.text


def test_editing_a_log_entry_is_not_logged_again(caplog, alice_user):
    from django.contrib.admin.models import ADDITION, LogEntry
    from django.contrib.contenttypes.models import ContentType

    entry = LogEntry.objects.create(
        user=alice_user,
        content_type=ContentType.objects.get_for_model(User),
        object_id=alice_user.pk,
        object_repr=str(alice_user),
        action_flag=ADDITION,
    )

    with caplog.at_level("INFO", logger="admin.audit"):
        entry.object_repr = "changed"
        entry.save()

    assert "Admin CREATE" not in caplog.text
