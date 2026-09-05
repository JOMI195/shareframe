import pytest

from user_core.blacklist import USERNAME_BLACKLIST
from user_core.serializers import UserCreateSerializer

pytestmark = pytest.mark.django_db


def _payload(username):
    return {
        "email": "newcomer@shareframe.local",
        "username": username,
        "password": "factory-pass1",
        "re_password": "factory-pass1",
    }


class TestUserCreateSerializer:
    """The route is 405 today; the rule has to hold when signup is switched on."""

    def test_a_blacklisted_username_is_refused(self):
        serializer = UserCreateSerializer(data=_payload(USERNAME_BLACKLIST[0]))

        assert not serializer.is_valid()
        assert "username" in serializer.errors

    def test_an_ordinary_username_is_accepted(self):
        serializer = UserCreateSerializer(data=_payload("newcomer"))

        assert serializer.is_valid(), serializer.errors
