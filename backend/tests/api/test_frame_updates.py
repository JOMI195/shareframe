import pytest

from frames.models import Frame
from tests.support import seed
from tests.support.factories import FrameGroupFactory, FrameTokenFactory, ReleaseFactory
from tests.support.helpers.frames import token_headers

pytestmark = pytest.mark.django_db

VERSIONS_URL = "/api/frame-updates/versions/"
LATEST_URL = "/api/frame-updates/latest/"


@pytest.fixture
def frame():
    return Frame.objects.get(private_serial_number="SEED-PRIVATE-0003")


@pytest.fixture
def board(client, frame):
    client.credentials(**{"HTTP_AUTHORIZATION": token_headers(FrameTokenFactory(frame=frame).access_token)["Authorization"]})
    return client


@pytest.fixture
def releases(frame):
    group = frame.groups.first()
    return [
        ReleaseFactory(version="1.2.0", groups=[group]),
        ReleaseFactory(version="1.10.0", groups=[group]),
        ReleaseFactory(version="1.9.0", groups=[group]),
    ]


def test_a_frame_token_is_required(client):
    assert client.get(VERSIONS_URL).status_code == 403


def test_an_expired_token_is_rejected(client, frame):
    token = FrameTokenFactory(frame=frame, expired=True)

    response = client.get(VERSIONS_URL, headers=token_headers(token.access_token))

    assert response.status_code == 403
    assert "expired" in response.data["detail"]


def test_an_unowned_frame_has_no_authenticated_user(client):
    """FrameTokenAuthentication returns frame.user, so a spare frame is refused."""
    spare = Frame.objects.get(private_serial_number="SEED-PRIVATE-0005")
    token = FrameTokenFactory(frame=spare)

    response = client.get(VERSIONS_URL, headers=token_headers(token.access_token))

    assert response.status_code == 403


class TestListVersions:
    def test_orders_by_semantic_version_not_lexically(self, board, releases):
        response = board.get(VERSIONS_URL)

        assert response.status_code == 200
        assert response.data["versions"] == ["1.10.0", "1.9.0", "1.2.0"]

    def test_inactive_releases_are_hidden(self, board, frame):
        ReleaseFactory(version="2.0.0", groups=[frame.groups.first()], is_active=False)

        assert "2.0.0" not in board.get(VERSIONS_URL).data["versions"]

    def test_a_release_for_another_group_is_hidden(self, board, releases):
        ReleaseFactory(version="3.0.0", groups=[FrameGroupFactory()])

        assert "3.0.0" not in board.get(VERSIONS_URL).data["versions"]

    def test_a_frame_without_groups_sees_nothing(self, client, releases):
        loner = Frame.objects.get(private_serial_number="SEED-PRIVATE-0004")
        loner.groups.clear()
        token = FrameTokenFactory(frame=loner)

        response = client.get(VERSIONS_URL, headers=token_headers(token.access_token))

        assert response.data["versions"] == []


class TestLatest:
    def test_returns_the_highest_version(self, board, releases):
        response = board.get(LATEST_URL)

        assert response.status_code == 200
        assert response.data["version"] == "1.10.0"

    def test_the_payload_carries_the_download_url_and_checksum(self, board, releases):
        response = board.get(LATEST_URL)

        assert response.data["checksum"]
        assert response.data["download_url"].endswith(".bin")
        assert response.data["criticality"]

    def test_no_releases_is_a_404(self, board):
        assert board.get(LATEST_URL).status_code == 404


class TestGetVersion:
    def url(self, version):
        return f"/api/frame-updates/{version}"

    def test_returns_the_named_release(self, board, releases):
        response = board.get(self.url("1.9.0"))

        assert response.status_code == 200
        assert response.data["version"] == "1.9.0"

    def test_an_unknown_version_is_a_404(self, board, releases):
        assert board.get(self.url("9.9.9")).status_code == 404

    def test_a_release_for_another_group_is_a_404(self, board, releases):
        ReleaseFactory(version="4.0.0", groups=[FrameGroupFactory()])

        assert board.get(self.url("4.0.0")).status_code == 404

    def test_an_inactive_release_is_a_404(self, board, frame):
        ReleaseFactory(version="5.0.0", groups=[frame.groups.first()], is_active=False)

        assert board.get(self.url("5.0.0")).status_code == 404
