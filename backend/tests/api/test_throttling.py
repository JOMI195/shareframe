import os

import pytest

from frames.models import Frame
from tests.support import seed
from tests.support.factories import FrameTokenFactory, ReleaseFactory
from tests.support.helpers.frames import token_headers

pytestmark = pytest.mark.django_db

VERSIONS_URL = "/api/frame-updates/versions/"
IMAGES_URL = "/api/images/"
# frame_updates_burst guards the firmware download, and is the cheapest to trip.
DOWNLOAD_LIMIT = 20


@pytest.fixture
def frame():
    return Frame.objects.get(private_serial_number="SEED-PRIVATE-0003")


@pytest.fixture
def download_url(frame):
    release = ReleaseFactory(groups=[frame.groups.first()])
    return "/api/media/frame-updates/" + os.path.basename(release.file.name)


def board_for(client, frame):
    token = FrameTokenFactory(frame=frame)
    client.credentials(
        HTTP_AUTHORIZATION=token_headers(token.access_token)["Authorization"]
    )
    return client


@pytest.fixture
def board(client, frame):
    return board_for(client, frame)


def test_the_rates_are_off_by_default(board, download_url):
    codes = [board.get(download_url).status_code for _ in range(DOWNLOAD_LIMIT + 5)]

    assert set(codes) == {200}


def test_the_download_burst_limit_trips(board, download_url, throttled):
    codes = [board.get(download_url).status_code for _ in range(DOWNLOAD_LIMIT + 1)]

    assert codes[:DOWNLOAD_LIMIT] == [200] * DOWNLOAD_LIMIT
    assert codes[-1] == 429


def test_the_response_says_how_long_to_wait(board, download_url, throttled):
    for _ in range(DOWNLOAD_LIMIT):
        board.get(download_url)

    response = board.get(download_url)

    assert response.status_code == 429
    assert "Retry-After" in response


def test_each_frame_of_one_owner_has_its_own_download_budget(
    client, board, download_url, throttled
):
    for _ in range(DOWNLOAD_LIMIT + 1):
        board.get(download_url)
    sibling = Frame.objects.get(private_serial_number="SEED-PRIVATE-0004")

    response = board_for(client, sibling).get(download_url)

    assert response.status_code == 200


def test_another_owner_has_their_own_budget(client, board, download_url, throttled):
    for _ in range(DOWNLOAD_LIMIT + 1):
        board.get(download_url)
    someone_elses = Frame.objects.get(private_serial_number="SEED-PRIVATE-0001")

    response = board_for(client, someone_elses).get(download_url)

    assert response.status_code == 200


def test_the_frame_api_keeps_its_own_generous_budget(board, download_url, throttled):
    """frame_burst guards the version endpoints, and is three times the download one."""
    for _ in range(DOWNLOAD_LIMIT + 1):
        board.get(download_url)

    assert board.get(VERSIONS_URL).status_code == 200


def test_the_image_limit_is_not_hit_by_ordinary_use(alice, throttled):
    codes = [alice.get(IMAGES_URL).status_code for _ in range(25)]

    assert set(codes) == {200}


UNSUBSCRIBE_URL = "/api/notifications/unsubscribe/"
# unsubscribe_burst, keyed on the client IP.
UNSUBSCRIBE_LIMIT = 10


def test_a_spoofed_forwarded_for_does_not_reset_the_ip_limit(client, throttled):
    codes = [
        client.post(
            UNSUBSCRIBE_URL,
            {},
            format="json",
            HTTP_X_FORWARDED_FOR=f"198.51.100.{i}, 203.0.113.5",
        ).status_code
        for i in range(UNSUBSCRIBE_LIMIT + 1)
    ]

    assert codes[-1] == 429


ONE_CLICK_URL = "/api/notifications/unsubscribe/one-click/"
# unsubscribe_one_click_burst; higher, because mail providers share few IPs.
ONE_CLICK_LIMIT = 60


def test_one_click_unsubscribe_has_its_own_higher_ip_limit(client, throttled):
    codes = [client.post(ONE_CLICK_URL).status_code for _ in range(ONE_CLICK_LIMIT + 1)]

    assert set(codes[: UNSUBSCRIBE_LIMIT + 1]) == {400}
    assert codes[-1] == 429


LOGIN_URL = "/api/auth/jwt/create/"
RESET_PASSWORD_URL = "/api/auth/users/reset_password/"
# failed_login and auth_email_burst, keyed on the client IP.
FAILED_LOGIN_LIMIT = 10
AUTH_EMAIL_LIMIT = 5


def login(client, password):
    email, _ = seed.credentials(seed.ALICE)
    return client.post(LOGIN_URL, {"email": email, "password": password}, format="json")


def test_failed_logins_trip_the_limit(client, throttled):
    codes = [
        login(client, "wrong-pass1").status_code for _ in range(FAILED_LOGIN_LIMIT + 1)
    ]

    assert codes[:FAILED_LOGIN_LIMIT] == [401] * FAILED_LOGIN_LIMIT
    assert codes[-1] == 429


def test_a_throttled_login_is_audited(client, throttled, caplog):
    with caplog.at_level("INFO", logger="admin.audit"):
        for _ in range(FAILED_LOGIN_LIMIT + 1):
            login(client, "wrong-pass1")

    assert "Login throttled from" in caplog.text


def test_the_limit_also_blocks_the_right_password(client, throttled):
    for _ in range(FAILED_LOGIN_LIMIT):
        login(client, "wrong-pass1")

    _, password = seed.credentials(seed.ALICE)

    assert login(client, password).status_code == 429


def test_successful_logins_do_not_count(client, throttled):
    _, password = seed.credentials(seed.ALICE)

    codes = [login(client, password).status_code for _ in range(FAILED_LOGIN_LIMIT + 2)]

    assert set(codes) == {200}


def test_password_reset_mails_trip_the_limit(client, throttled):
    email, _ = seed.credentials(seed.ALICE)

    codes = [
        client.post(RESET_PASSWORD_URL, {"email": email}, format="json").status_code
        for _ in range(AUTH_EMAIL_LIMIT + 1)
    ]

    assert codes[:AUTH_EMAIL_LIMIT] == [204] * AUTH_EMAIL_LIMIT
    assert codes[-1] == 429
