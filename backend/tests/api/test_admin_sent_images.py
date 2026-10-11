import re

import pytest
from django.test import Client

from sent_images.models import SentImage, SentImageStatus
from tests.support.factories import FriendshipFactory, SentImageFactory, UserFactory

pytestmark = pytest.mark.django_db

URL = "/api/admin/sent_images/sentimage/"


@pytest.fixture
def admin_client():
    client = Client()
    client.force_login(UserFactory(is_active=True, is_staff=True, is_admin=True))
    return client


@pytest.fixture
def scheduled():
    sender = UserFactory()
    reciever = UserFactory()
    FriendshipFactory(sender=sender, reciever=reciever, status="accepted")
    return SentImageFactory(sender=sender, reciever=reciever, scheduled=True)


def row_button(html, sent_image, action):
    pattern = (
        rf'name="(_action__[^"]*__{action}__sent_images__sentimage__{sent_image.pk})"'
    )
    match = re.search(pattern, html)
    return match.group(1) if match else None


def test_only_scheduled_rows_get_buttons(admin_client, scheduled):
    sent = SentImageFactory()

    html = admin_client.get(URL).content.decode()

    assert row_button(html, scheduled, "send_now")
    assert row_button(html, scheduled, "cancel")
    assert row_button(html, sent, "send_now") is None


def test_a_row_click_confirms_before_sending(admin_client, scheduled):
    button = row_button(admin_client.get(URL).content.decode(), scheduled, "send_now")

    confirm = admin_client.post(URL, {button: "Send now"})

    assert "admin/confirm_action.html" in [t.name for t in confirm.templates]
    scheduled.refresh_from_db()
    assert scheduled.status == SentImageStatus.SCHEDULED


def test_confirming_sends_it(admin_client, scheduled):
    response = admin_client.post(
        URL,
        {
            "action": "send_scheduled_now",
            "_selected_action": scheduled.pk,
            "apply": "yes",
        },
    )

    assert response.status_code == 302
    scheduled.refresh_from_db()
    assert scheduled.status == SentImageStatus.SENT


def test_confirming_a_cancel_deletes_it(admin_client, scheduled):
    admin_client.post(
        URL,
        {
            "action": "cancel_scheduled",
            "_selected_action": scheduled.pk,
            "apply": "yes",
        },
    )

    assert not SentImage.objects.filter(pk=scheduled.pk).exists()


def test_a_cancel_leaves_delivered_images_alone(admin_client):
    sent = SentImageFactory()

    admin_client.post(
        URL, {"action": "cancel_scheduled", "_selected_action": sent.pk, "apply": "yes"}
    )

    assert SentImage.objects.filter(pk=sent.pk).exists()
