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


def test_an_otp_needs_no_confirmation(model_admin, staff):
    frame = FrameFactory()
    request = admin_request(staff)

    response = model_admin.otp(request, frame)

    assert response is None
    assert "OTP" in str(list(get_messages(request))[0])
