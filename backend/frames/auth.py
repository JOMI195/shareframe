import base64
import datetime
import hashlib
import hmac
import logging
from django.conf import settings
from datetime import timezone as dt_timezone
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.exceptions import InvalidSignature
from .models import Frame, FrameToken

logger = logging.getLogger(__name__)


# ===== Current device auth: ed25519 signature =====
class FrameSignatureAuthentication(BaseAuthentication):
    """
    Authenticate a frame by an ed25519 signature over '<frame_id>:<timestamp>'.

    Headers: Authorization: Ed25519-Sig <base64 sig>, X-Frame-ID, X-Timestamp.
    Self-contained so the legacy HMAC path can be removed without touching this.
    """

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Ed25519-Sig "):
            return None  # not our scheme — let the next class try

        signature_b64 = auth_header.split(" ", 1)[1]
        timestamp = request.headers.get("X-Timestamp")
        frame_id = request.headers.get("X-Frame-ID")

        if not timestamp:
            raise AuthenticationFailed("X-Timestamp header is required.")
        if not frame_id:
            raise AuthenticationFailed("X-Frame-ID header is required.")

        # Reject stale / future-dated requests
        try:
            timestamp_dt = datetime.datetime.fromtimestamp(
                int(timestamp), tz=dt_timezone.utc
            )
        except (ValueError, TypeError):
            raise AuthenticationFailed("Invalid timestamp format.")
        if abs((timezone.now() - timestamp_dt).total_seconds()) > (
            settings.FRAME_AUTH_TIMESTAMP_VALIDATION_WINDOW_MIN * 60
        ):
            raise AuthenticationFailed("Request timestamp is too old or future dated.")

        try:
            frame = Frame.objects.get(
                public_serial_number=frame_id,
                public_key__isnull=False,
            )
        except Frame.DoesNotExist:
            raise AuthenticationFailed("Invalid authorization credentials.")

        try:
            public_key = Ed25519PublicKey.from_public_bytes(
                base64.b64decode(frame.public_key)
            )
            public_key.verify(
                base64.b64decode(signature_b64),
                f"{frame_id}:{timestamp}".encode(),
            )
        except (InvalidSignature, ValueError, Exception) as e:
            logger.warning(
                "Signature auth failed for frame %s: %s", frame_id, type(e).__name__
            )
            raise AuthenticationFailed("Invalid authorization credentials.")

        return (frame.user, frame)


# ===== LEGACY device auth: HMAC-SHA256 (old Python boards) =====
# Deletable as a unit once no legacy boards remain.
class FrameHTTPAuth:
    """LEGACY. HMAC-SHA256 authentication for old Python boards."""

    def authenticate_frame_from_headers(self, request):
        """
        Authenticate a frame using the headers from the request.
        """
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return False, Response(
                {"error": "Authorization header is required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        timestamp = request.headers.get("X-Timestamp")

        if not timestamp:
            return False, Response(
                {"error": "X-Timestamp header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate timestamp is recent
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

        if auth_header.startswith("Auth-Hash "):
            received_hash = auth_header.split(" ", 1)[1]
            return self._authenticate_hmac(received_hash, timestamp)
        else:
            return False, Response(
                {"error": "Unsupported authorization method."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

    def _authenticate_hmac(self, received_hash, timestamp):
        """Authenticate using HMAC-SHA256 (legacy method for Python boards)."""
        frames = Frame.objects.all()
        matching_frame = None

        for frame in frames:
            expected_hash = self._generate_hmac_hash(
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

    def _generate_hmac_hash(self, private_serial_number, timestamp):
        """Generate HMAC-SHA256 hash for legacy auth."""
        secret_key = settings.FRAME_AUTH_SECRET_KEY
        message = f"{private_serial_number}:{timestamp}".encode()
        digest = hmac.new(
            secret_key.encode(), message, digestmod=hashlib.sha256
        ).hexdigest()
        return digest


# LEGACY DRF authentication class wrapping FrameHTTPAuth (HMAC only)
class FrameHTTPAuthentication(BaseAuthentication):

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Auth-Hash "):
            return None

        is_authenticated, result = FrameHTTPAuth().authenticate_frame_from_headers(request)

        if not is_authenticated:
            raise AuthenticationFailed(result.data.get("error", "Authentication failed"))

        frame = result
        return (frame.user, frame)


# authentication with frame-token
class FrameTokenAuthentication(BaseAuthentication):

    def authenticate(self, request):
        token = request.headers.get("Authorization")

        if not token:
            return None

        try:
            prefix, access_token = token.split(" ")
            if prefix.lower() != "frame-access-token":
                return None  # Not our auth type — let next class try
        except ValueError:
            return None  # Can't parse — let next class try

        try:
            frame_token = FrameToken.objects.select_related("frame").get(
                access_token=access_token
            )

            if not frame_token.is_access_token_valid():
                raise AuthenticationFailed("Token has expired")

            return (frame_token.frame.user, frame_token.frame)

        except FrameToken.DoesNotExist:
            raise AuthenticationFailed("Invalid token")
