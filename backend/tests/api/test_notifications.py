import pytest

from notifications.choices import NotificationChannel, NotificationKind
from notifications.models import PushSubscription
from notifications.unsubscribe import make_token
from tests.support.factories import UserFactory
from tests.support.helpers.notifications import enable_channels
from user_accounts.models import NotificationKindPreference, NotificationPreference

pytestmark = pytest.mark.django_db

ME_URL = "/api/auth/users/me/"
KEY_URL = "/api/notifications/push/key/"
SUBSCRIPTIONS_URL = "/api/notifications/push/subscriptions/"
UNSUBSCRIBE_URL = "/api/notifications/unsubscribe/"

KIND = NotificationKind.INACTIVITY_REMINDER
EMAIL = NotificationChannel.EMAIL
PUSH = NotificationChannel.PUSH
SUBSCRIPTION = {
    "endpoint": "https://push.example.com/abc",
    "p256dh": "key",
    "auth": "secret",
}


@pytest.fixture
def user():
    return UserFactory(is_active=True)


@pytest.mark.parametrize(
    ("method", "url"),
    [("get", KEY_URL), ("post", SUBSCRIPTIONS_URL), ("delete", SUBSCRIPTIONS_URL)],
)
def test_push_endpoints_require_authentication(client, method, url):
    assert getattr(client, method)(url).status_code == 401


def test_the_public_key_is_served(client_as, user, settings):
    settings.VAPID_PUBLIC_KEY = "public"

    response = client_as(user).get(KEY_URL)

    assert response.status_code == 200
    assert response.data == {"public_key": "public"}


class TestPushSubscriptions:
    def test_a_subscription_is_stored_for_the_account(self, client_as, user):
        response = client_as(user).post(SUBSCRIPTIONS_URL, SUBSCRIPTION, format="json")

        assert response.status_code == 204
        assert (
            PushSubscription.objects.get(endpoint=SUBSCRIPTION["endpoint"]).account
            == user.account
        )

    def test_the_same_browser_moves_to_the_next_account(self, client_as, user):
        other = UserFactory(is_active=True)
        client_as(user).post(SUBSCRIPTIONS_URL, SUBSCRIPTION, format="json")

        client_as(other).post(SUBSCRIPTIONS_URL, SUBSCRIPTION, format="json")

        subscriptions = PushSubscription.objects.filter(
            endpoint=SUBSCRIPTION["endpoint"]
        )
        assert [s.account for s in subscriptions] == [other.account]

    def test_a_subscription_is_removed(self, client_as, user):
        api = client_as(user)
        api.post(SUBSCRIPTIONS_URL, SUBSCRIPTION, format="json")

        response = api.delete(
            SUBSCRIPTIONS_URL, {"endpoint": SUBSCRIPTION["endpoint"]}, format="json"
        )

        assert response.status_code == 204
        assert not PushSubscription.objects.filter(account=user.account).exists()

    def test_another_accounts_subscription_is_left_alone(self, client_as, user):
        other = UserFactory(is_active=True)
        client_as(other).post(SUBSCRIPTIONS_URL, SUBSCRIPTION, format="json")

        client_as(user).delete(
            SUBSCRIPTIONS_URL, {"endpoint": SUBSCRIPTION["endpoint"]}, format="json"
        )

        assert PushSubscription.objects.filter(account=other.account).exists()


def patch_preferences(api, preferences):
    return api.patch(
        ME_URL, {"account": {"notification_preferences": preferences}}, format="json"
    )


class TestPreferences:
    def test_only_admin_enabled_kinds_and_channels_are_listed(self, client_as, user):
        enable_channels(KIND, EMAIL)
        enable_channels(NotificationKind.CHANGELOG, PUSH, EMAIL)

        response = client_as(user).get(ME_URL)

        assert response.data["account"]["notification_preferences"] == [
            {
                "kind": KIND,
                "enabled": True,
                "channels": [{"channel": EMAIL, "enabled": True}],
            },
            {
                "kind": NotificationKind.CHANGELOG,
                "enabled": True,
                "channels": [
                    {"channel": PUSH, "enabled": True},
                    {"channel": EMAIL, "enabled": True},
                ],
            },
        ]

    def test_nothing_is_listed_by_default(self, client_as, user):
        response = client_as(user).get(ME_URL)

        assert response.data["account"]["notification_preferences"] == []

    def test_a_kind_is_turned_off_as_a_whole(self, client_as, user):
        enable_channels(KIND, EMAIL)

        response = patch_preferences(
            client_as(user), [{"kind": KIND, "enabled": False}]
        )

        assert response.status_code == 200
        assert (
            response.data["account"]["notification_preferences"][0]["enabled"] is False
        )
        assert not NotificationKindPreference.is_enabled(user.account, KIND)
        assert NotificationPreference.is_enabled(user.account, KIND, EMAIL)

    def test_a_channel_is_turned_off_alone(self, client_as, user):
        enable_channels(KIND, EMAIL)

        response = patch_preferences(
            client_as(user),
            [{"kind": KIND, "channels": [{"channel": EMAIL, "enabled": False}]}],
        )

        assert response.status_code == 200
        assert response.data["account"]["notification_preferences"] == [
            {
                "kind": KIND,
                "enabled": True,
                "channels": [{"channel": EMAIL, "enabled": False}],
            }
        ]
        assert not NotificationPreference.is_enabled(user.account, KIND, EMAIL)

    def test_a_disabled_kind_is_rejected(self, client_as, user):
        response = patch_preferences(
            client_as(user), [{"kind": KIND, "enabled": False}]
        )

        assert response.status_code == 400
        assert NotificationKindPreference.is_enabled(user.account, KIND)

    def test_a_disabled_channel_is_rejected(self, client_as, user):
        enable_channels(KIND, EMAIL)

        response = patch_preferences(
            client_as(user),
            [{"kind": KIND, "channels": [{"channel": PUSH, "enabled": False}]}],
        )

        assert response.status_code == 400
        assert NotificationPreference.is_enabled(user.account, KIND, PUSH)

    def test_the_search_flag_still_saves_alone(self, client_as, user):
        response = client_as(user).patch(
            ME_URL, {"account": {"friendship_user_searchable": False}}, format="json"
        )

        assert response.status_code == 200
        user.account.refresh_from_db()
        assert user.account.friendship_user_searchable is False


class TestUnsubscribe:
    def test_a_valid_token_opts_out_without_signing_in(self, client, user):
        token = make_token(user.account, KIND, EMAIL)

        response = client.post(UNSUBSCRIBE_URL, {"token": token}, format="json")

        assert response.status_code == 204
        assert not NotificationPreference.is_enabled(user.account, KIND, EMAIL)

    def test_a_tampered_token_is_rejected(self, client, user):
        token = make_token(user.account, KIND, EMAIL)

        response = client.post(UNSUBSCRIBE_URL, {"token": token + "x"}, format="json")

        assert response.status_code == 400
        assert NotificationPreference.is_enabled(user.account, KIND, EMAIL)

    def test_a_missing_token_is_rejected(self, client):
        assert client.post(UNSUBSCRIBE_URL, {}, format="json").status_code == 400
