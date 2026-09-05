import pytest

from tests.support import seed
from tests.support.factories import UserFactory
from user_accounts.models import Account
from user_core.models import User

pytestmark = pytest.mark.django_db


def test_a_search_code_is_eight_uppercase_characters():
    account = UserFactory().account

    code = account.friendship_user_search_code
    assert len(code) == 8
    # A uuid4 slice can be all digits, so isupper() is not the right check.
    assert code == code.upper()


def test_codes_are_unique_across_users():
    codes = {UserFactory().account.friendship_user_search_code for _ in range(5)}

    assert len(codes) == 5


def test_a_taken_code_is_retried(monkeypatch):
    taken = User.objects.get(username=seed.ALICE).account.friendship_user_search_code
    user = UserFactory()
    user.account.delete()
    codes = iter([taken, "FRESH001"])

    class FakeUUID:
        def __str__(self):
            return f"{next(codes).lower()}-rest"

    monkeypatch.setattr("user_accounts.models.uuid.uuid4", FakeUUID)

    account = Account.objects.create_account(user=user)

    assert account.friendship_user_search_code == "FRESH001"


def test_accounts_default_to_searchable():
    assert UserFactory().account.friendship_user_searchable


def test_the_account_is_keyed_on_the_user():
    user = UserFactory()

    assert user.account.pk == user.pk


def test_deleting_the_user_deletes_the_account():
    user = UserFactory()
    pk = user.pk

    User.objects.filter(pk=pk).delete()

    assert not Account.objects.filter(pk=pk).exists()


def test_the_seeded_codes_match_the_json():
    for username, entry in seed.users().items():
        account = User.objects.get(username=username).account

        assert account.friendship_user_search_code == entry["friendship_code"]
        assert account.friendship_user_searchable == entry["friendship_user_searchable"]
