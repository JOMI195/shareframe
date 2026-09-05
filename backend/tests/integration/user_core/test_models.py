import pytest

from tests.support import seed
from tests.support.factories import UserFactory
from user_accounts.models import Account
from user_core.blacklist import USERNAME_BLACKLIST
from user_core.models import User

pytestmark = pytest.mark.django_db

MAX_USERNAME = User._meta.get_field("username").max_length


class TestCreateUser:
    def test_creates_the_account_alongside(self):
        user = UserFactory()

        assert Account.objects.filter(user=user).exists()
        assert user.account.friendship_user_search_code

    def test_normalises_the_email_domain(self):
        user = User.objects.create_user(
            email="Mixed.Case@ShareFrame.Local", username="normalise_me", password="x1"
        )

        assert user.email == "Mixed.Case@shareframe.local"

    def test_the_password_is_hashed(self):
        user = UserFactory(password="factory-pass1")

        assert user.password != "factory-pass1"
        assert user.check_password("factory-pass1")

    def test_requires_an_email(self):
        with pytest.raises(ValueError):
            User.objects.create_user(email="", username="no_mail", password="x1")

    def test_rejects_a_blacklisted_username(self):
        with pytest.raises(ValueError):
            User.objects.create_user(
                email="banned@shareframe.local",
                username=USERNAME_BLACKLIST[0],
                password="x1",
            )

    def test_a_rejected_username_leaves_no_account_behind(self):
        before = Account.objects.count()

        with pytest.raises(ValueError):
            User.objects.create_user(
                email="banned2@shareframe.local",
                username=USERNAME_BLACKLIST[0],
                password="x1",
            )

        assert Account.objects.count() == before

    def test_a_new_user_is_inactive(self):
        assert not UserFactory().is_active


def test_create_superuser_sets_the_staff_flags():
    admin = User.objects.create_superuser(
        email="root@shareframe.local", username="root_user", password="x1"
    )

    assert admin.is_staff and admin.is_admin and admin.is_active


class TestDelete:
    def test_anonymises_the_username_within_the_column(self):
        """A 45 character username once broke a 25 character column."""
        user = UserFactory()
        original = user.username

        user.delete()

        assert user.username != original
        assert len(user.username) <= MAX_USERNAME

    def test_the_row_survives_as_a_soft_delete(self):
        user = UserFactory()

        user.delete()

        assert User.objects.filter(pk=user.pk).exists()
        assert User.objects.get(pk=user.pk).is_deleted

    def test_the_email_is_replaced(self):
        user = UserFactory()
        original = user.email

        user.delete()

        assert user.email != original
        assert user.email.endswith("@deleted.de")

    def test_the_account_stops_being_searchable(self):
        user = UserFactory()

        user.delete()

        assert not User.objects.get(pk=user.pk).account.friendship_user_searchable

    def test_the_password_is_replaced(self):
        user = UserFactory(password="factory-pass1")

        user.delete()

        assert not user.check_password("factory-pass1")

    def test_the_privileges_are_dropped(self):
        user = UserFactory(is_staff=True, is_superuser=True)

        user.delete()

        assert not user.is_active and not user.is_staff and not user.is_superuser

    def test_the_username_can_be_kept(self):
        user = UserFactory()
        original = user.username

        user.delete(anonymize=False)

        assert user.username == original

    def test_two_deletions_do_not_collide(self):
        first, second = UserFactory(), UserFactory()

        first.delete()
        second.delete()

        assert first.username != second.username
        assert first.email != second.email


def test_the_seeded_accounts_are_active():
    assert User.objects.get(username=seed.ALICE).is_active


def test_the_email_is_the_login_field():
    assert User.USERNAME_FIELD == "email"
