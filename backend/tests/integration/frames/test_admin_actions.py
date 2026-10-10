import pytest
from django.contrib import admin
from django.contrib.messages import get_messages
from django.contrib.messages.storage.fallback import FallbackStorage
from django.test import RequestFactory

from frames.models import Frame
from tests.support.factories import FrameFactory, UserFactory

pytestmark = pytest.mark.django_db


@pytest.fixture
def model_admin():
    return admin.site._registry[Frame]


@pytest.fixture
def staff():
    return UserFactory(is_active=True, is_staff=True, is_admin=True)


def admin_request(user, data=None):
    request = RequestFactory().post("/api/admin/frames/frame/", data or {})
    request.user = user
    request.session = {}
    request._messages = FallbackStorage(request)
    return request


def test_a_new_keypair_asks_for_confirmation_first(model_admin, staff):
    frame = FrameFactory()

    response = model_admin.keypair(admin_request(staff), frame)

    assert response.template_name == "admin/confirm_action.html"
    assert list(response.context_data["objects"]) == [frame]
    assert response.context_data["action"] == "generate_keypair"
    assert Frame.objects.get(pk=frame.pk).public_key == frame.public_key


def test_confirming_replaces_the_keypair(model_admin, staff):
    frame = FrameFactory()
    request = admin_request(staff, {"apply": "yes"})

    model_admin.keypair(request, frame)

    frame_after = Frame.objects.get(pk=frame.pk)
    assert frame_after.public_key != frame.public_key
    assert "private key seed" in str(list(get_messages(request))[0])


def test_an_otp_needs_no_confirmation(model_admin, staff):
    frame = FrameFactory()
    request = admin_request(staff)

    response = model_admin.otp(request, frame)

    assert response is None
    assert "OTP" in str(list(get_messages(request))[0])
