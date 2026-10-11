from types import SimpleNamespace

import pytest
from django.utils import timezone

from sent_images.models import SentImage, SentImageStatus
from tests.support import seed
from tests.support.factories import FriendshipFactory, SentImageFactory, UserFactory
from user_core.models import User

pytestmark = pytest.mark.django_db

URL = "/api/sent-images/"


@pytest.fixture
def alice_user():
    return User.objects.get(username=seed.ALICE)


def test_requires_authentication(client):
    assert client.get(URL).status_code == 401


def test_lists_the_users_own_traffic(alice, alice_user):
    response = alice.get(URL)

    assert response.status_code == 200
    from django.db.models import Q

    assert (
        response.data["count"]
        == SentImage.objects.filter(
            Q(sender=alice_user) | Q(reciever=alice_user)
        ).count()
    )


def test_the_page_size_can_be_changed(alice):
    response = alice.get(URL, {"page_size": 2})

    assert len(response.data["results"]) == 2


def test_filters_to_what_was_sent_to_you(alice, alice_user):
    response = alice.get(URL, {"shipping": "sentToYou"})

    assert all(entry["reciever"] == seed.ALICE for entry in response.data["results"])


def test_filters_to_what_you_sent(alice):
    response = alice.get(URL, {"shipping": "sentByYou"})

    assert all(entry["sender"] == seed.ALICE for entry in response.data["results"])


def test_filters_to_active_entries(alice):
    response = alice.get(URL, {"status": "active"})

    now = timezone.now()
    assert all(
        entry["expires_at"] > now.isoformat() for entry in response.data["results"]
    )


def test_filters_by_sender_name(alice):
    response = alice.get(URL, {"sender": seed.BOB})

    assert all(entry["sender"] == seed.BOB for entry in response.data["results"])


def test_the_payload_carries_the_image_and_its_variants(alice):
    entry = alice.get(URL).data["results"][0]

    assert entry["image"]["url"]
    assert entry["image"]["variants"]


def test_creating_through_post_is_not_allowed(alice):
    assert alice.post(URL, {}, format="json").status_code == 405


class TestRetrieve:
    def test_returns_an_entry_the_user_is_part_of(self, alice, alice_user):
        sent = SentImage.objects.filter(sender=alice_user).first()

        response = alice.get(f"{URL}{sent.pk}/")

        assert response.status_code == 200
        assert response.data["id"] == sent.pk

    def test_someone_elses_entry_is_not_visible(self, alice):
        theirs = SentImageFactory()

        assert alice.get(f"{URL}{theirs.pk}/").status_code == 400


# async_to_sync reaches the ORM on its own connection, so the data must be committed.
@pytest.mark.django_db(transaction=True)
class TestDeactivate:
    @pytest.fixture
    def world(self, client_as):
        me = UserFactory(is_active=True)
        return SimpleNamespace(client=client_as(me), user=me)

    def test_expires_the_entry_immediately(self, world):
        sent = SentImageFactory(sender=world.user)

        response = world.client.post(
            f"{URL}{sent.pk}/deactivate-sent-image/", {}, format="json"
        )

        assert response.status_code == 200
        sent.refresh_from_db()
        assert sent.expires_at < timezone.now()

    def test_a_scheduled_entry_cannot_be_deactivated(self, world):
        scheduled = SentImageFactory(sender=world.user, scheduled=True)

        response = world.client.post(
            f"{URL}{scheduled.pk}/deactivate-sent-image/", {}, format="json"
        )

        assert response.status_code == 404

    def test_someone_elses_entry_cannot_be_deactivated(self, world):
        theirs = SentImageFactory()

        response = world.client.post(
            f"{URL}{theirs.pk}/deactivate-sent-image/", {}, format="json"
        )

        assert response.status_code == 404

    def test_the_receiver_may_also_deactivate(self, world):
        sent = SentImageFactory(reciever=world.user)

        response = world.client.post(
            f"{URL}{sent.pk}/deactivate-sent-image/", {}, format="json"
        )

        assert response.status_code == 200


class TestCancelScheduled:
    @pytest.fixture
    def world(self, client_as):
        me = UserFactory(is_active=True)
        return SimpleNamespace(client=client_as(me), user=me)

    def cancel(self, world, sent):
        return world.client.post(f"{URL}{sent.pk}/cancel-scheduled/", {}, format="json")

    def test_the_sender_cancels_it(self, world):
        scheduled = SentImageFactory(sender=world.user, scheduled=True)

        assert self.cancel(world, scheduled).status_code == 204
        assert not SentImage.objects.filter(pk=scheduled.pk).exists()

    def test_the_receiver_cannot_cancel_it(self, world):
        scheduled = SentImageFactory(reciever=world.user, scheduled=True)

        assert self.cancel(world, scheduled).status_code == 404
        assert SentImage.objects.filter(pk=scheduled.pk).exists()

    def test_a_delivered_entry_cannot_be_cancelled(self, world):
        sent = SentImageFactory(sender=world.user)

        assert self.cancel(world, sent).status_code == 404


# async_to_sync reaches the ORM on its own connection, so the data must be committed.
@pytest.mark.django_db(transaction=True)
class TestSendNow:
    @pytest.fixture
    def world(self, client_as):
        me = UserFactory(is_active=True)
        friend = UserFactory(is_active=True)
        FriendshipFactory(sender=me, reciever=friend, status="accepted")
        return SimpleNamespace(client=client_as(me), user=me, friend=friend)

    def send_now(self, world, sent):
        return world.client.post(f"{URL}{sent.pk}/send-now/", {}, format="json")

    def test_the_sender_sends_it_now(self, world):
        scheduled = SentImageFactory(
            sender=world.user, reciever=world.friend, scheduled=True
        )

        response = self.send_now(world, scheduled)

        assert response.status_code == 200
        assert response.data["status"] == SentImageStatus.SENT
        scheduled.refresh_from_db()
        assert scheduled.status == SentImageStatus.SENT

    def test_the_receiver_cannot_send_it(self, world):
        scheduled = SentImageFactory(
            sender=world.friend, reciever=world.user, scheduled=True
        )

        assert self.send_now(world, scheduled).status_code == 404

    def test_a_delivered_entry_is_not_sent_again(self, world):
        sent = SentImageFactory(sender=world.user, reciever=world.friend)

        assert self.send_now(world, sent).status_code == 404
