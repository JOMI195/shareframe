import pytest
from django.utils import timezone
from freezegun import freeze_time

from frames.models import Frame, FrameOTP, FrameToken
from tests.support import seed
from tests.support.factories import FrameTokenFactory

pytestmark = pytest.mark.django_db


@pytest.fixture
def frame():
    return Frame.objects.get(private_serial_number="SEED-PRIVATE-0003")


class TestTokens:
    def test_generate_tokens_honours_the_configured_lifetime(self, frame, monkeypatch):
        monkeypatch.setenv("DJANGO_FRAME_ACCESSTOKEN_LIFETIME_DAYS", "3")

        data = FrameToken.generate_tokens(frame)

        assert (data["access_token_expires_at"] - timezone.now()).days == 2

    def test_a_fresh_token_is_valid(self):
        assert FrameTokenFactory().is_access_token_valid()

    def test_an_expired_token_is_not(self):
        assert not FrameTokenFactory(expired=True).is_access_token_valid()

    def test_get_or_create_token_creates_one(self, frame):
        token = frame.get_or_create_token()

        assert token.access_token
        assert FrameToken.objects.filter(frame=frame).count() == 1

    def test_a_healthy_token_is_reused(self, frame):
        first = frame.get_or_create_token()

        second = Frame.objects.get(pk=frame.pk).get_or_create_token()

        assert first.access_token == second.access_token

    def test_a_token_inside_the_renewal_window_is_replaced(self, frame, monkeypatch):
        """The window is how long before expiry a board is handed a new token."""
        monkeypatch.setenv("DJANGO_FRAME_ACCESSTOKEN_EXPIRATION_WINDOW_HOURS", "24")
        first = frame.get_or_create_token()
        FrameToken.objects.filter(pk=first.pk).update(
            access_token_expires_at=timezone.now() + timezone.timedelta(hours=1)
        )

        second = Frame.objects.get(pk=frame.pk).get_or_create_token()

        assert second.access_token != first.access_token
        assert FrameToken.objects.filter(frame=frame).count() == 1

    def test_an_expired_token_is_replaced(self, frame):
        expired = FrameTokenFactory(frame=frame, expired=True)

        replacement = Frame.objects.get(pk=frame.pk).get_or_create_token()

        assert replacement.access_token != expired.access_token


class TestOTP:
    def test_generates_six_digits(self, frame):
        code = frame.generate_otp()

        assert len(code) == 6 and code.isdigit()

    def test_a_second_otp_replaces_the_first(self, frame):
        first = frame.generate_otp()

        second = Frame.objects.get(pk=frame.pk).generate_otp()

        assert first != second or FrameOTP.objects.filter(frame=frame).count() == 1
        assert FrameOTP.objects.filter(frame=frame).count() == 1

    def test_verifying_consumes_the_otp(self, frame):
        code = frame.generate_otp()

        assert frame.verify_otp(code)
        assert not FrameOTP.objects.filter(frame=frame).exists()

    def test_the_wrong_code_is_rejected_and_the_otp_survives(self, frame):
        frame.generate_otp()

        assert not frame.verify_otp("000000")
        assert FrameOTP.objects.filter(frame=frame).exists()

    def test_an_expired_otp_is_rejected_and_cleared(self, frame):
        with freeze_time(timezone.now() - timezone.timedelta(minutes=30)):
            code = frame.generate_otp(expiry_minutes=10)

        assert not Frame.objects.get(pk=frame.pk).verify_otp(code)
        assert not FrameOTP.objects.filter(frame=frame).exists()

    def test_verifying_without_an_otp_is_false(self, frame):
        assert not frame.verify_otp("123456")

    def test_is_valid_tracks_the_expiry(self):
        from tests.support.factories import FrameOTPFactory

        assert FrameOTPFactory().is_valid()
        assert not FrameOTPFactory(expired=True).is_valid()


def test_the_seeded_serial_is_derived_from_the_seed(frame):
    """seed_dev_data derives public_serial_number, it is never stored in the JSON."""
    from tests.support.helpers.frames import serial_for

    entry = seed.frames()["seed-frame-alice-living"]
    assert frame.public_serial_number == serial_for(entry["seed_b64"])


def test_a_frame_may_be_unowned():
    entry = seed.unowned_frame()

    assert Frame.objects.get(private_serial_number=entry["private_serial_number"]).user is None
