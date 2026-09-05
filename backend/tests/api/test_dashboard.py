import pytest
from django.utils import timezone

from frames.models import Frame
from images.models import Image
from sent_images.models import SentImage
from tests.support import seed
from tests.support.factories import SentImageFactory
from user_core.models import User

pytestmark = pytest.mark.django_db

URL = "/api/dashboard/statistics/"


@pytest.fixture
def alice_user():
    return User.objects.get(username=seed.ALICE)


def test_requires_authentication(client):
    assert client.get(URL).status_code == 401


def test_reports_the_three_sections(alice):
    response = alice.get(URL)

    assert response.status_code == 200
    assert set(response.data) == {"images", "sent_images", "frames"}


def test_counts_the_users_own_uploads(alice, alice_user):
    response = alice.get(URL)

    assert response.data["images"]["uploaded_images_by_me_count"] == Image.objects.filter(
        user=alice_user, markedAsDeleted=False
    ).count()


def test_counts_only_active_images_received(alice, alice_user):
    response = alice.get(URL)

    assert response.data["sent_images"]["active_images_to_me_count"] == SentImage.objects.filter(
        reciever=alice_user, expires_at__gt=timezone.now()
    ).count()


def test_reports_the_latest_expiring_image(alice, alice_user):
    latest = SentImageFactory(
        reciever=alice_user, expires_at=timezone.now() + timezone.timedelta(days=365)
    )

    payload = alice.get(URL).data["sent_images"]["latest_expiring_image"]

    assert payload["id"] == latest.pk
    assert payload["sender"] == latest.sender.username


def test_the_latest_expiring_image_may_be_absent(bob):
    SentImage.objects.filter(reciever__username=seed.BOB).delete()

    assert bob.get(URL).data["sent_images"]["latest_expiring_image"] is None


def test_the_week_runs_monday_to_sunday(alice):
    weekly = alice.get(URL).data["sent_images"]["weekly_activity"]

    assert [day["day"] for day in weekly] == ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]


def test_the_week_carries_both_directions(alice):
    weekly = alice.get(URL).data["sent_images"]["weekly_activity"]

    assert all({"sent_count", "received_count"} <= set(day) for day in weekly)
    assert sum(day["sent_count"] + day["received_count"] for day in weekly) > 0


def test_lists_the_users_frames(alice, alice_user):
    frames = alice.get(URL).data["frames"]

    assert {frame["id"] for frame in frames} == set(
        Frame.objects.filter(user=alice_user).values_list("id", flat=True)
    )


def test_a_frame_that_never_connected_reports_no_last_seen(alice, alice_user):
    Frame.objects.filter(user=alice_user).update(last_seen=None)

    assert all(frame["last_seen"] is None for frame in alice.get(URL).data["frames"])
