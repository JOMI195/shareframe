import pytest
from django.conf import settings
from django.core import mail
from freezegun import freeze_time

from tests.support import seed
from tests.support.factories import UserFactory
from tests.support.helpers.mail import break_delivery
from user_core import email_change
from user_core.blacklist import USERNAME_BLACKLIST
from user_core.models import User

pytestmark = pytest.mark.django_db

ME_URL = "/api/auth/users/me/"
USERS_URL = "/api/auth/users/"
SET_PASSWORD_URL = "/api/auth/users/set_password/"
REQUEST_EMAIL_CHANGE_URL = "/api/auth/users/request_email_change/"
CONFIRM_EMAIL_CHANGE_URL = "/api/auth/users/confirm_email_change/"


def test_me_requires_authentication(client):
    assert client.get(ME_URL).status_code == 401


def test_me_returns_the_profile_with_its_account(alice):
    response = alice.get(ME_URL)

    assert response.status_code == 200
    assert response.data["username"] == seed.ALICE
    assert (
        response.data["account"]["friendship_user_search_code"]
        == seed.user(seed.ALICE)["friendship_code"]
    )


class TestUpdateProfile:
    def test_the_username_can_be_changed(self, client_as):
        user = UserFactory(is_active=True)

        response = client_as(user).patch(
            ME_URL, {"username": "renamed_user"}, format="json"
        )

        assert response.status_code == 200
        user.refresh_from_db()
        assert user.username == "renamed_user"

    def test_the_search_flag_travels_with_the_profile(self, client_as):
        user = UserFactory(is_active=True)

        response = client_as(user).patch(
            ME_URL, {"account": {"friendship_user_searchable": False}}, format="json"
        )

        assert response.status_code == 200
        assert not User.objects.get(pk=user.pk).account.friendship_user_searchable

    def test_the_email_is_read_only(self, client_as):
        user = UserFactory(is_active=True)
        original = user.email

        client_as(user).patch(ME_URL, {"email": "new@shareframe.local"}, format="json")

        user.refresh_from_db()
        assert user.email == original

    def test_a_blacklisted_username_is_refused(self, client_as):
        user = UserFactory(is_active=True)
        original = user.username

        response = client_as(user).patch(
            ME_URL, {"username": USERNAME_BLACKLIST[0]}, format="json"
        )

        assert response.status_code == 400
        user.refresh_from_db()
        assert user.username == original

    def test_the_csrf_header_is_required(self, client_as):
        user = UserFactory(is_active=True)
        client = client_as(user)
        client.cookies.pop("csrftoken")

        assert (
            client.patch(ME_URL, {"username": "nope"}, format="json").status_code == 403
        )


class TestDeleteAccount:
    def test_the_correct_password_deletes_the_account(self, client_as):
        user = UserFactory(is_active=True)

        response = client_as(user).delete(
            ME_URL, {"password": "factory-pass1"}, format="json"
        )

        assert response.status_code == 204
        assert not User.objects.filter(pk=user.pk).exists()

    def test_the_auth_cookies_are_cleared(self, client_as):
        user = UserFactory(is_active=True)

        response = client_as(user).delete(
            ME_URL, {"password": "factory-pass1"}, format="json"
        )

        for name in (
            settings.AUTH_COOKIE_ACCESS_NAME,
            settings.AUTH_COOKIE_REFRESH_NAME,
        ):
            assert response.cookies[name].value == ""

    def test_a_failed_farewell_mail_still_signs_out(self, client_as, monkeypatch):
        user = UserFactory(is_active=True)
        client = client_as(user)
        break_delivery(monkeypatch)

        response = client.delete(ME_URL, {"password": "factory-pass1"}, format="json")

        assert response.status_code == 204
        assert not User.objects.filter(pk=user.pk).exists()
        assert response.cookies[settings.AUTH_COOKIE_ACCESS_NAME].value == ""

    def test_a_wrong_password_answers_400(self, client_as):
        user = UserFactory(is_active=True)

        response = client_as(user).delete(
            ME_URL, {"password": "not-the-password1"}, format="json"
        )

        assert response.status_code == 400
        assert User.objects.filter(pk=user.pk).exists()

    def test_a_wrong_password_sends_no_mail(self, client_as):
        """A re-check of the current user is not a login, so nothing is notified."""
        client = client_as(UserFactory(is_active=True))
        before = len(mail.outbox)

        client.delete(ME_URL, {"password": "not-the-password1"}, format="json")

        assert len(mail.outbox) == before

    def test_the_password_is_required(self, client_as):
        user = UserFactory(is_active=True)

        assert client_as(user).delete(ME_URL, {}, format="json").status_code == 400

    def test_the_user_is_told_by_mail(self, client_as):
        user = UserFactory(is_active=True)
        before = len(mail.outbox)

        client_as(user).delete(ME_URL, {"password": "factory-pass1"}, format="json")

        assert len(mail.outbox) > before


class TestSetPassword:
    def test_changes_the_password(self, client_as):
        user = UserFactory(is_active=True)

        response = client_as(user).post(
            SET_PASSWORD_URL,
            {
                "current_password": "factory-pass1",
                "new_password": "brand-new-pass1",
                "re_new_password": "brand-new-pass1",
            },
            format="json",
        )

        assert response.status_code == 204
        assert User.objects.get(pk=user.pk).check_password("brand-new-pass1")

    def test_the_current_password_must_match(self, client_as):
        user = UserFactory(is_active=True)

        response = client_as(user).post(
            SET_PASSWORD_URL,
            {
                "current_password": "wrong-pass1",
                "new_password": "brand-new-pass1",
                "re_new_password": "brand-new-pass1",
            },
            format="json",
        )

        assert response.status_code == 400

    def test_the_two_new_passwords_must_agree(self, client_as):
        user = UserFactory(is_active=True)

        response = client_as(user).post(
            SET_PASSWORD_URL,
            {
                "current_password": "factory-pass1",
                "new_password": "brand-new-pass1",
                "re_new_password": "something-else1",
            },
            format="json",
        )

        assert response.status_code == 400


@pytest.mark.parametrize(
    "method,path",
    [
        ("post", ""),
        ("delete", "1/"),
        ("post", "set_email/"),
        ("post", "reset_email/"),
        ("post", "reset_email_confirm/"),
    ],
)
def test_the_disabled_verbs_answer_405(alice, method, path):
    response = getattr(alice, method)(f"{USERS_URL}{path}", {}, format="json")

    assert response.status_code == 405


class TestEmailChange:
    @pytest.fixture
    def user(self):
        return UserFactory(is_active=True, email="before@example.com")

    def request_change(self, client, new_email, password="factory-pass1"):
        return client.post(
            REQUEST_EMAIL_CHANGE_URL,
            {"current_password": password, "new_email": new_email},
            format="json",
        )

    def token_for(self, user, new_email):
        return email_change.make_token(user, new_email)

    def test_requesting_needs_a_signed_in_user(self, client):
        assert self.request_change(client, "after@example.com").status_code == 401

    def test_requesting_mails_the_new_address_and_keeps_the_old_one(
        self, client_as, user
    ):
        response = self.request_change(client_as(user), "after@example.com")

        assert response.status_code == 204
        assert mail.outbox[-1].to == ["after@example.com"]
        assert "auth/users/email-change/" in mail.outbox[-1].body
        user.refresh_from_db()
        assert user.email == "before@example.com"

    def test_a_wrong_password_is_rejected(self, client_as, user):
        response = self.request_change(
            client_as(user), "after@example.com", password="wrong-pass1"
        )

        assert response.status_code == 400
        assert all(m.to == ["before@example.com"] for m in mail.outbox)

    @pytest.mark.parametrize("taken", ["taken@example.com", "TAKEN@example.com"])
    def test_an_address_already_in_use_is_rejected(self, client_as, user, taken):
        UserFactory(email="taken@example.com")

        response = self.request_change(client_as(user), taken)

        assert response.status_code == 400
        assert all(m.to == ["before@example.com"] for m in mail.outbox)

    def test_the_own_address_is_rejected(self, client_as, user):
        response = self.request_change(client_as(user), "Before@example.com")

        assert response.status_code == 400

    def test_confirming_switches_the_address_and_notifies_the_old_one(
        self, client, user
    ):
        response = client.post(
            CONFIRM_EMAIL_CHANGE_URL,
            {"token": self.token_for(user, "after@example.com")},
            format="json",
        )

        assert response.status_code == 204
        user.refresh_from_db()
        assert user.email == "after@example.com"
        assert mail.outbox[-1].to == ["before@example.com"]

    def test_a_link_works_only_once(self, client, user):
        token = self.token_for(user, "after@example.com")
        client.post(CONFIRM_EMAIL_CHANGE_URL, {"token": token}, format="json")

        response = client.post(
            CONFIRM_EMAIL_CHANGE_URL, {"token": token}, format="json"
        )

        assert response.status_code == 400

    def test_a_tampered_link_is_rejected(self, client, user):
        token = self.token_for(user, "after@example.com")

        response = client.post(
            CONFIRM_EMAIL_CHANGE_URL, {"token": token + "x"}, format="json"
        )

        assert response.status_code == 400
        user.refresh_from_db()
        assert user.email == "before@example.com"

    def test_an_expired_link_is_rejected(self, client, user):
        with freeze_time("2026-01-01 12:00:00"):
            token = self.token_for(user, "after@example.com")

        with freeze_time("2026-01-02 12:00:01"):
            response = client.post(
                CONFIRM_EMAIL_CHANGE_URL, {"token": token}, format="json"
            )

        assert response.status_code == 400

    def test_an_address_taken_in_the_meantime_is_rejected(self, client, user):
        token = self.token_for(user, "after@example.com")
        UserFactory(email="after@example.com")

        response = client.post(
            CONFIRM_EMAIL_CHANGE_URL, {"token": token}, format="json"
        )

        assert response.status_code == 400
        user.refresh_from_db()
        assert user.email == "before@example.com"

    def test_the_new_address_signs_in(self, client, user):
        client.post(
            CONFIRM_EMAIL_CHANGE_URL,
            {"token": self.token_for(user, "after@example.com")},
            format="json",
        )

        response = client.post(
            "/api/auth/jwt/create/",
            {"email": "after@example.com", "password": "factory-pass1"},
            format="json",
        )

        assert response.status_code == 200
