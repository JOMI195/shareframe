import os

import pytest

from frames.models import Frame
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
    client.credentials(HTTP_AUTHORIZATION=token_headers(token.access_token)["Authorization"])
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


def test_two_frames_of_one_owner_share_the_download_budget(
    client, board, download_url, throttled
):
    """The download throttle is a UserRateThrottle, so it keys on the owner."""
    for _ in range(DOWNLOAD_LIMIT + 1):
        board.get(download_url)
    sibling = Frame.objects.get(private_serial_number="SEED-PRIVATE-0004")

    response = board_for(client, sibling).get(download_url)

    assert response.status_code == 429


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
