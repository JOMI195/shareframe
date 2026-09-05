import time

import pytest
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.test import APIRequestFactory

from frames.auth import (
    FrameHTTPAuthentication,
    FrameSignatureAuthentication,
    FrameTokenAuthentication,
)
from frames.models import Frame
from tests.support import seed
from tests.support.factories import FrameTokenFactory
from tests.support.helpers.frames import hmac_headers, signature_headers, token_headers

pytestmark = pytest.mark.django_db

ALICE_FRAME = "seed-frame-alice-living"


def request_with(headers):
    return APIRequestFactory().get("/api/frames/", headers=headers)


@pytest.fixture
def entry():
    return seed.frames()[ALICE_FRAME]


@pytest.fixture
def frame(entry):
    return Frame.objects.get(private_serial_number=entry["private_serial_number"])


class TestSignatureAuth:
    def test_a_valid_signature_authenticates_the_owner(self, entry, frame):
        user, authenticated = FrameSignatureAuthentication().authenticate(
            request_with(signature_headers(entry["seed_b64"]))
        )

        assert authenticated == frame
        assert user == frame.user

    def test_another_scheme_is_left_to_the_next_class(self):
        assert FrameSignatureAuthentication().authenticate(
            request_with({"Authorization": "Bearer something"})
        ) is None

    def test_a_missing_timestamp_is_rejected(self, entry):
        headers = signature_headers(entry["seed_b64"])
        del headers["X-Timestamp"]

        with pytest.raises(AuthenticationFailed):
            FrameSignatureAuthentication().authenticate(request_with(headers))

    def test_a_missing_frame_id_is_rejected(self, entry):
        headers = signature_headers(entry["seed_b64"])
        del headers["X-Frame-ID"]

        with pytest.raises(AuthenticationFailed):
            FrameSignatureAuthentication().authenticate(request_with(headers))

    def test_an_unparsable_timestamp_is_rejected(self, entry):
        headers = signature_headers(entry["seed_b64"])
        headers["X-Timestamp"] = "yesterday"

        with pytest.raises(AuthenticationFailed):
            FrameSignatureAuthentication().authenticate(request_with(headers))

    def test_a_stale_timestamp_is_rejected(self, entry, settings):
        stale = int(time.time()) - (settings.FRAME_AUTH_TIMESTAMP_VALIDATION_WINDOW_MIN + 1) * 60

        with pytest.raises(AuthenticationFailed):
            FrameSignatureAuthentication().authenticate(
                request_with(signature_headers(entry["seed_b64"], timestamp=stale))
            )

    def test_a_future_dated_timestamp_is_rejected(self, entry, settings):
        ahead = int(time.time()) + (settings.FRAME_AUTH_TIMESTAMP_VALIDATION_WINDOW_MIN + 1) * 60

        with pytest.raises(AuthenticationFailed):
            FrameSignatureAuthentication().authenticate(
                request_with(signature_headers(entry["seed_b64"], timestamp=ahead))
            )

    def test_an_unknown_frame_id_is_rejected(self, entry):
        headers = signature_headers(entry["seed_b64"])
        headers["X-Frame-ID"] = "AAAA-BBBB-CCCC-DDDD"

        with pytest.raises(AuthenticationFailed):
            FrameSignatureAuthentication().authenticate(request_with(headers))

    def test_a_signature_from_another_key_is_rejected(self, entry):
        other = seed.frames()["seed-frame-office"]
        headers = signature_headers(other["seed_b64"])
        headers["X-Frame-ID"] = signature_headers(entry["seed_b64"])["X-Frame-ID"]

        with pytest.raises(AuthenticationFailed):
            FrameSignatureAuthentication().authenticate(request_with(headers))

    def test_a_signature_over_another_timestamp_is_rejected(self, entry):
        headers = signature_headers(entry["seed_b64"])
        headers["X-Timestamp"] = str(int(headers["X-Timestamp"]) - 1)

        with pytest.raises(AuthenticationFailed):
            FrameSignatureAuthentication().authenticate(request_with(headers))


class TestLegacyHmacAuth:
    def test_a_valid_digest_authenticates(self, entry, frame):
        user, authenticated = FrameHTTPAuthentication().authenticate(
            request_with(hmac_headers(entry["private_serial_number"]))
        )

        assert authenticated == frame
        assert user == frame.user

    def test_another_scheme_is_left_to_the_next_class(self, entry):
        assert FrameHTTPAuthentication().authenticate(
            request_with(signature_headers(entry["seed_b64"]))
        ) is None

    def test_an_unknown_serial_is_rejected(self):
        with pytest.raises(AuthenticationFailed):
            FrameHTTPAuthentication().authenticate(request_with(hmac_headers("NOPE-0000")))

    def test_the_wrong_secret_is_rejected(self, entry):
        headers = hmac_headers(entry["private_serial_number"], secret="not-the-secret")

        with pytest.raises(AuthenticationFailed):
            FrameHTTPAuthentication().authenticate(request_with(headers))

    def test_a_stale_timestamp_is_rejected(self, entry, settings):
        stale = int(time.time()) - (settings.FRAME_AUTH_TIMESTAMP_VALIDATION_WINDOW_MIN + 1) * 60

        with pytest.raises(AuthenticationFailed):
            FrameHTTPAuthentication().authenticate(
                request_with(hmac_headers(entry["private_serial_number"], timestamp=stale))
            )


class TestTokenAuth:
    def test_a_valid_token_authenticates(self, frame):
        token = FrameTokenFactory(frame=frame)

        user, authenticated = FrameTokenAuthentication().authenticate(
            request_with(token_headers(token.access_token))
        )

        assert authenticated == frame
        assert user == frame.user

    def test_no_header_is_left_to_the_next_class(self):
        assert FrameTokenAuthentication().authenticate(request_with({})) is None

    def test_another_scheme_is_left_to_the_next_class(self):
        assert FrameTokenAuthentication().authenticate(
            request_with({"Authorization": "Bearer abc"})
        ) is None

    def test_an_unparsable_header_is_left_to_the_next_class(self):
        assert FrameTokenAuthentication().authenticate(
            request_with({"Authorization": "no-space"})
        ) is None

    def test_an_unknown_token_is_rejected(self):
        with pytest.raises(AuthenticationFailed):
            FrameTokenAuthentication().authenticate(
                request_with(token_headers("11111111-2222-3333-4444-555555555555"))
            )

    def test_an_expired_token_is_rejected(self, frame):
        token = FrameTokenFactory(frame=frame, expired=True)

        with pytest.raises(AuthenticationFailed):
            FrameTokenAuthentication().authenticate(
                request_with(token_headers(token.access_token))
            )
