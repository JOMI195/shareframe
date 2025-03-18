import datetime
import hashlib
import hmac
from django.conf import settings
from datetime import timezone as dt_timezone
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from .models import Frame


class FrameHTTPAuth:
    """
    provides authentication methods for Frame authentication.
    """

    def authenticate_frame_from_headers(self, request):
        """
        Authenticate a frame using the headers from the request.
        """

        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Auth-Hash "):
            return False, Response(
                {"error": "Valid Authorization header is required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        timestamp = request.headers.get("X-Timestamp")

        if not timestamp:
            return False, Response(
                {"error": "X-Timestamp header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate timestamp is recent (within some minutes for stronger security)
        try:
            timestamp_dt = datetime.datetime.fromtimestamp(
                int(timestamp), tz=dt_timezone.utc
            )
            time_diff = timezone.now() - timestamp_dt
            if abs(time_diff.total_seconds()) > (
                settings.FRAME_AUTH_TIMESTAMP_VALIDATION_WINDOW_MIN * 60
            ):
                return False, Response(
                    {"error": "Request timestamp is too old or future dated."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
        except (ValueError, TypeError):
            return False, Response(
                {"error": "Invalid timestamp format."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        received_hash = auth_header.split(" ")[1]

        frames = Frame.objects.all()
        matching_frame = None

        for frame in frames:
            expected_hash = self.generate_auth_hash(
                frame.private_serial_number, timestamp
            )
            if hmac.compare_digest(received_hash, expected_hash):
                matching_frame = frame
                break

        if not matching_frame:
            return False, Response(
                {"error": "Invalid authorization credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return True, matching_frame

    def generate_auth_hash(self, private_serial_number, timestamp):
        """
        Generate a secure hash of the private serial number and timestamp using HMAC
        """
        secret_key = settings.FRAME_AUTH_SECRET_KEY

        message = f"{private_serial_number}:{timestamp}".encode()

        digest = hmac.new(
            secret_key.encode(), message, digestmod=hashlib.sha256
        ).hexdigest()

        return digest
