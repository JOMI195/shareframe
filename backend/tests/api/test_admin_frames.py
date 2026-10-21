import pytest
from django.test import Client

from frames.keys import public_key_fingerprint
from frames.models import Frame
from tests.support.factories import FrameFactory, UserFactory
from tests.support.factories.frames import keypair

pytestmark = pytest.mark.django_db

URL = "/api/admin/frames/frame/"


@pytest.fixture
def admin_client():
    client = Client()
    client.force_login(UserFactory(is_active=True, is_staff=True, is_admin=True))
    return client


def frame_form(**fields):
    return {"is_active": "on", **management_forms(), **fields}


def management_forms():
    prefixes = ("frame_token", "frame_websocket_connections", "commands", "diagnostics")
    data = {}
    for prefix in prefixes:
        data[f"{prefix}-TOTAL_FORMS"] = "0"
        data[f"{prefix}-INITIAL_FORMS"] = "0"
    return data


def test_a_pasted_public_key_registers_the_frame(admin_client):
    _, public_key = keypair()

    response = admin_client.post(f"{URL}add/", frame_form(public_key=public_key))

    assert response.status_code == 302
    frame = Frame.objects.get(public_key=public_key)
    assert frame.public_serial_number == public_key_fingerprint(public_key)
    assert frame.private_serial_number


def test_a_new_frame_needs_a_public_key(admin_client):
    count = Frame.objects.count()

    response = admin_client.post(f"{URL}add/", frame_form())

    assert response.status_code == 200
    assert "public_key" in response.context["adminform"].form.errors
    assert Frame.objects.count() == count


def test_an_invalid_public_key_is_rejected(admin_client):
    count = Frame.objects.count()

    response = admin_client.post(f"{URL}add/", frame_form(public_key="!!!"))

    assert response.status_code == 200
    assert "public_key" in response.context["adminform"].form.errors
    assert Frame.objects.count() == count


def test_a_new_public_key_moves_the_serial(admin_client):
    frame = FrameFactory()
    _, public_key = keypair()

    response = admin_client.post(
        f"{URL}{frame.pk}/change/",
        frame_form(
            public_key=public_key,
            private_serial_number=frame.private_serial_number,
        ),
    )

    assert response.status_code == 302
    frame.refresh_from_db()
    assert frame.public_key == public_key
    assert frame.public_serial_number == public_key_fingerprint(public_key)


def test_the_change_page_offers_no_keypair_button(admin_client):
    frame = FrameFactory()

    html = admin_client.get(URL).content.decode()

    assert f"__keypair__frames__frame__{frame.pk}" not in html
