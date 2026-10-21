import re

import pytest
from django.test import Client

from tests.support.factories import FrameFactory, UserFactory

pytestmark = pytest.mark.django_db

URL = "/api/admin/frames/frame/"


@pytest.fixture
def admin_client():
    client = Client()
    client.force_login(UserFactory(is_active=True, is_staff=True, is_admin=True))
    return client


def row_button(html, frame, action):
    pattern = rf'name="(_action__[^"]*__{action}__frames__frame__{frame.pk})"'
    return re.search(pattern, html).group(1)


def test_the_changelist_shows_row_buttons(admin_client):
    frame = FrameFactory()

    html = admin_client.get(URL).content.decode()

    assert row_button(html, frame, "otp")


def test_a_row_otp_click_redirects_back_with_the_code(admin_client):
    frame = FrameFactory()
    button = row_button(admin_client.get(URL).content.decode(), frame, "otp")

    response = admin_client.post(URL, {button: "OTP"}, follow=True)

    assert response.redirect_chain[-1][0] == URL
    assert "OTP:" in response.content.decode()
