import pytest
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from sent_images.views import SentImagesViewSet
from tests.support import seed
from tests.support.factories import SentImageFactory, UserFactory
from user_core.models import User

pytestmark = pytest.mark.django_db


@pytest.fixture
def me():
    return UserFactory(username="filter_me")


@pytest.fixture
def other():
    return UserFactory(username="filter_other")


def results(user, **params):
    request = Request(APIRequestFactory().get("/api/sent-images/", params))
    request.user = user
    view = SentImagesViewSet()
    view.request = request
    return list(view.get_queryset())


def test_only_the_users_own_traffic_is_visible(me, other):
    mine = SentImageFactory(sender=me, reciever=other)
    theirs = SentImageFactory(sender=other, reciever=UserFactory())

    assert results(me) == [mine]
    assert theirs not in results(me)


def test_status_active_hides_expired(me, other):
    active = SentImageFactory(sender=me, reciever=other)
    SentImageFactory(sender=me, reciever=other, expired=True)

    assert results(me, status="active") == [active]


def test_status_expired_hides_active(me, other):
    SentImageFactory(sender=me, reciever=other)
    expired = SentImageFactory(sender=me, reciever=other, expired=True)

    assert results(me, status="expired") == [expired]


def test_status_all_shows_both(me, other):
    SentImageFactory(sender=me, reciever=other)
    SentImageFactory(sender=me, reciever=other, expired=True)

    assert len(results(me, status="all")) == 2


def test_shipping_sent_to_you(me, other):
    received = SentImageFactory(sender=other, reciever=me)
    SentImageFactory(sender=me, reciever=other)

    assert results(me, shipping="sentToYou") == [received]


def test_shipping_sent_by_you(me, other):
    SentImageFactory(sender=other, reciever=me)
    sent = SentImageFactory(sender=me, reciever=other)

    assert results(me, shipping="sentByYou") == [sent]


def test_sender_du_means_the_current_user(me, other):
    SentImageFactory(sender=other, reciever=me)
    sent = SentImageFactory(sender=me, reciever=other)

    assert results(me, sender="Du") == [sent]
    assert results(me, sender="du") == [sent]


def test_receiver_du_means_the_current_user(me, other):
    received = SentImageFactory(sender=other, reciever=me)
    SentImageFactory(sender=me, reciever=other)

    assert results(me, receiver="Du") == [received]


def test_sender_matches_a_username_fragment(me, other):
    received = SentImageFactory(sender=other, reciever=me)
    SentImageFactory(sender=me, reciever=other)

    assert results(me, sender="OTHER") == [received]


def test_receiver_matches_a_username_fragment(me, other):
    SentImageFactory(sender=other, reciever=me)
    sent = SentImageFactory(sender=me, reciever=other)

    assert results(me, receiver="other") == [sent]


def test_filters_combine(me, other):
    SentImageFactory(sender=other, reciever=me)
    SentImageFactory(sender=me, reciever=other, expired=True)
    wanted = SentImageFactory(sender=me, reciever=other)

    assert results(me, status="active", shipping="sentByYou") == [wanted]


def test_newest_first(me, other):
    older = SentImageFactory(sender=me, reciever=other)
    newer = SentImageFactory(sender=me, reciever=other)

    assert results(me)[0] in (newer, older)
    assert len(results(me)) == 2


def test_the_seeded_corpus_gives_alice_both_directions():
    alice = User.objects.get(username=seed.ALICE)

    everything = results(alice)

    assert any(item.sender == alice for item in everything)
    assert any(item.reciever == alice for item in everything)
