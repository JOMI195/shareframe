import pytest

from friendships.models import Friendship
from tests.support import seed
from user_core.models import User

pytestmark = pytest.mark.django_db

LIST_URL = "/api/friendships/"
SEND_URL = "/api/friendships/send-request/"


def code_of(username):
    return seed.user(username)["friendship_code"]


def friendship_between(a, b, status):
    return Friendship.objects.get(
        sender__username=a, reciever__username=b, status=status
    )


def test_requires_authentication(client):
    assert client.get(LIST_URL).status_code == 401


def test_lists_only_the_users_own_friendships(alice):
    response = alice.get(LIST_URL)

    assert response.status_code == 200
    assert len(response.data) == sum(
        1
        for entry in seed.friendships()
        if seed.ALICE in (entry["sender"], entry["reciever"])
    )


def test_creating_through_post_is_not_allowed(alice):
    assert alice.post(LIST_URL, {}, format="json").status_code == 405


class TestSendRequest:
    def test_sends_to_a_searchable_user(self, alice):
        response = alice.post(
            SEND_URL,
            {"reciever_friendship_user_search_code": code_of(seed.DAVE)},
            format="json",
        )

        assert response.status_code == 201
        assert response.data["status"] == "pending"

    def test_an_unknown_code_is_rejected(self, alice):
        response = alice.post(
            SEND_URL, {"reciever_friendship_user_search_code": "NOSUCH01"}, format="json"
        )

        assert response.status_code == 400

    def test_a_user_who_is_not_searchable_cannot_be_found(self, alice):
        response = alice.post(
            SEND_URL,
            {"reciever_friendship_user_search_code": code_of(seed.MALLORY)},
            format="json",
        )

        assert response.status_code == 400

    def test_a_request_to_yourself_is_rejected(self, alice):
        response = alice.post(
            SEND_URL,
            {"reciever_friendship_user_search_code": code_of(seed.ALICE)},
            format="json",
        )

        assert response.status_code == 400
        assert "yourself" in response.data["detail"]

    def test_a_second_pending_request_is_rejected(self, alice):
        response = alice.post(
            SEND_URL,
            {"reciever_friendship_user_search_code": code_of(seed.ERIN)},
            format="json",
        )

        assert response.status_code == 400
        assert "already sent" in response.data["detail"]

    def test_an_existing_friendship_blocks_a_new_request(self, alice):
        response = alice.post(
            SEND_URL,
            {"reciever_friendship_user_search_code": code_of(seed.BOB)},
            format="json",
        )

        assert response.status_code == 400


class TestAcceptRequest:
    def test_the_receiver_can_accept(self, alice):
        pending = friendship_between(seed.DAVE, seed.ALICE, "pending")

        response = alice.post(f"{LIST_URL}{pending.pk}/accept-request/", {}, format="json")

        assert response.status_code == 200
        pending.refresh_from_db()
        assert pending.status == "accepted"

    def test_the_sender_cannot_accept_their_own(self, alice):
        pending = friendship_between(seed.ALICE, seed.ERIN, "pending")

        response = alice.post(f"{LIST_URL}{pending.pk}/accept-request/", {}, format="json")

        assert response.status_code == 400

    def test_an_already_accepted_request_cannot_be_accepted_again(self, alice):
        accepted = friendship_between(seed.ALICE, seed.BOB, "accepted")

        response = alice.post(f"{LIST_URL}{accepted.pk}/accept-request/", {}, format="json")

        assert response.status_code == 400

    def test_accepting_while_already_friends_rejects_the_request(self, alice):
        bob = User.objects.get(username=seed.BOB)
        duplicate = Friendship.objects.create(
            sender=bob, reciever=User.objects.get(username=seed.ALICE), status="pending"
        )

        response = alice.post(f"{LIST_URL}{duplicate.pk}/accept-request/", {}, format="json")

        assert response.status_code == 400
        duplicate.refresh_from_db()
        assert duplicate.status == "rejected"


class TestRejectRequest:
    def test_the_receiver_can_reject(self, alice):
        pending = friendship_between(seed.DAVE, seed.ALICE, "pending")

        response = alice.post(f"{LIST_URL}{pending.pk}/reject-request/", {}, format="json")

        assert response.status_code == 200
        pending.refresh_from_db()
        assert pending.status == "rejected"

    def test_the_sender_cannot_reject_their_own(self, alice):
        pending = friendship_between(seed.ALICE, seed.ERIN, "pending")

        response = alice.post(f"{LIST_URL}{pending.pk}/reject-request/", {}, format="json")

        assert response.status_code == 400


class TestRetrieveAndDestroy:
    def test_retrieves_a_friendship_the_user_is_part_of(self, alice):
        accepted = friendship_between(seed.ALICE, seed.BOB, "accepted")

        response = alice.get(f"{LIST_URL}{accepted.pk}/")

        assert response.status_code == 200
        assert response.data["id"] == accepted.pk

    def test_someone_elses_friendship_is_not_visible(self, alice):
        other = friendship_between(seed.BOB, seed.CAROL, "accepted")

        assert alice.get(f"{LIST_URL}{other.pk}/").status_code == 400

    def test_ending_a_friendship_removes_it(self, alice):
        accepted = friendship_between(seed.ALICE, seed.CAROL, "accepted")

        response = alice.delete(f"{LIST_URL}{accepted.pk}/")

        assert response.status_code == 200
        assert not Friendship.objects.filter(pk=accepted.pk).exists()

    def test_someone_elses_friendship_cannot_be_ended(self, alice):
        other = friendship_between(seed.BOB, seed.CAROL, "accepted")

        assert alice.delete(f"{LIST_URL}{other.pk}/").status_code == 400
        assert Friendship.objects.filter(pk=other.pk).exists()
