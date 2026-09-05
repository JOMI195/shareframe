import pytest
from django.core import mail

from tests.support import seed
from tests.support.factories import UserFactory
from user_core.models import User

pytestmark = pytest.mark.django_db

ME_URL = "/api/auth/users/me/"
USERS_URL = "/api/auth/users/"
SET_PASSWORD_URL = "/api/auth/users/set_password/"


def test_me_requires_authentication(client):
    assert client.get(ME_URL).status_code == 401


def test_me_returns_the_profile_with_its_account(alice):
    response = alice.get(ME_URL)

    assert response.status_code == 200
    assert response.data["username"] == seed.ALICE
    assert response.data["account"]["friendship_user_search_code"] == seed.user(
        seed.ALICE
    )["friendship_code"]


class TestUpdateProfile:
    def test_the_username_can_be_changed(self, client_as):
        user = UserFactory(is_active=True)

        response = client_as(user).patch(ME_URL, {"username": "renamed_user"}, format="json")

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

    def test_a_blacklisted_username_is_accepted_on_update(self, client_as):
        """Known gap: the blacklist is enforced in create_user only."""
        from user_core.blacklist import USERNAME_BLACKLIST

        user = UserFactory(is_active=True)

        response = client_as(user).patch(
            ME_URL, {"username": USERNAME_BLACKLIST[0]}, format="json"
        )

        assert response.status_code == 200

    def test_the_csrf_header_is_required(self, client_as):
        user = UserFactory(is_active=True)
        client = client_as(user)
        client.cookies.pop("csrftoken")

        assert client.patch(ME_URL, {"username": "nope"}, format="json").status_code == 403


class TestDeleteAccount:
    def test_the_correct_password_deletes_the_account(self, client_as):
        user = UserFactory(is_active=True)

        response = client_as(user).delete(
            ME_URL, {"password": "factory-pass1"}, format="json"
        )

        assert response.status_code == 204
        assert User.objects.get(pk=user.pk).is_deleted

    def test_a_wrong_password_raises_instead_of_answering_400(self, client_as):
        """Known bug: authenticate() is called without the request, so the
        user_login_failed receiver dereferences None. Should be the 400 below."""
        user = UserFactory(is_active=True)

        with pytest.raises(AttributeError):
            client_as(user).delete(
                ME_URL, {"password": "not-the-password1"}, format="json"
            )

        assert not User.objects.get(pk=user.pk).is_deleted

    def test_the_password_is_required(self, client_as):
        user = UserFactory(is_active=True)

        assert client_as(user).delete(ME_URL, {}, format="json").status_code == 400

    def test_the_user_is_told_by_mail(self, client_as):
        user = UserFactory(is_active=True)
        before = len(mail.outbox)

        client_as(user).delete(ME_URL, {"password": "factory-pass1"}, format="json")

        assert len(mail.outbox) > before

    def test_the_username_can_be_kept(self, client_as):
        user = UserFactory(is_active=True)
        original = user.username

        client_as(user).delete(
            ME_URL, {"password": "factory-pass1", "anonymize": False}, format="json"
        )

        assert User.objects.get(pk=user.pk).username == original


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


@pytest.mark.parametrize("method,path", [("post", ""), ("delete", "1/")])
def test_the_disabled_verbs_answer_405(alice, method, path):
    response = getattr(alice, method)(f"{USERS_URL}{path}", {}, format="json")

    assert response.status_code == 405
