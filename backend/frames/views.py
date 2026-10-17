import json
import logging
import os
import zlib
from datetime import UTC, datetime, timedelta

from asgiref.sync import async_to_sync
from django.conf import settings
from django.core.files.base import ContentFile
from django.db.models import Q
from django.utils import timezone
from django.utils.timezone import now
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from config.throttles import (
    BurstRateThrottle,
    FrameBurstRateThrottle,
    FrameSustainedRateThrottle,
    SustainedRateThrottle,
)
from friendships.models import Friendship
from images.models import Image
from securePayload.securePayload import SecurePayload
from sent_images.models import SentImage, SentImageStatus
from sent_images.serializers import SentImagesRetrieveSerializer
from user_core.models import User
from user_stats.counters import record_send
from utils.request_logging.decorators import no_logging

from .auth import (
    FrameHTTPAuthentication,
    FrameSignatureAuthentication,
    FrameTokenAuthentication,
)
from .consumers import FrameWebSocketConsumer
from .models import Frame, FrameCommand, FrameDiagnostics, FrameToken
from .serializers import FrameRetrieveSerializer

telemetry_logger = logging.getLogger("frames.telemetry")

DIAGNOSTICS_MAX_UPLOAD_BYTES = 256 * 1024
DIAGNOSTICS_MAX_TEXT_BYTES = 4 * 1024 * 1024


def _parse_future_unix_timestamp(value) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromtimestamp(float(value), tz=UTC)
    except (ValueError, OverflowError) as e:
        raise ValueError("Invalid Unix timestamp provided.") from e
    if parsed <= now():
        raise ValueError("The provided timestamp must be in the future.")
    return parsed


class FramesViewSet(viewsets.ModelViewSet):
    http_method_names = ["get", "post", "head", "options"]
    queryset = Frame.objects.all().order_by("-registered_at")
    throttle_classes = [BurstRateThrottle, SustainedRateThrottle]

    @staticmethod
    def _issue_token(frame):
        frame_token = frame.get_or_create_token()
        frame_token.last_obtained = timezone.now()
        frame_token.save()
        return Response(
            {
                "access_token": frame_token.access_token,
                "expires_at": frame_token.access_token_expires_at,
            }
        )

    def get_serializer_class(self):
        if self.action == "list":
            return FrameRetrieveSerializer
        if self.action == "retrieve":
            return FrameRetrieveSerializer
        return self.serializer_class

    def get_permissions(self):
        if self.action == "list":
            self.permission_classes = [IsAuthenticated]
        elif self.action == "retrieve":
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user, is_active=True)

    @extend_schema(
        responses={200: FrameRetrieveSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        responses={200: FrameRetrieveSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        try:
            element = self.get_queryset().get(pk=self.kwargs["pk"])
        except Frame.DoesNotExist:
            return Response(
                {"detail": "Frame not found or you don't have permissions to view it."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(element)
        return Response(serializer.data)

    @extend_schema(exclude=True)
    def create(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @extend_schema(exclude=True)
    def update(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @extend_schema(exclude=True)
    def partial_update(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @extend_schema(exclude=True)
    def destroy(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(
        detail=False,
        methods=["POST"],
        permission_classes=[IsAuthenticated],
        url_path="register-user",
    )
    def register_user(self, request):
        public_serial_number = request.data.get("public_serial_number")

        if not public_serial_number:
            return Response(
                {"error": "Public serial number is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        error_mess = "Frame not found because of invalid serial number or already registered to a user."

        try:
            frame = Frame.objects.get(
                public_serial_number=public_serial_number, is_active=True
            )
        except Frame.DoesNotExist:
            return Response(
                {"error": error_mess},
                status=status.HTTP_404_NOT_FOUND,
            )

        if frame.user:
            return Response(
                {"error": error_mess},
                status=status.HTTP_400_BAD_REQUEST,
            )

        frame.user = request.user
        frame.save()

        serializer = FrameRetrieveSerializer(frame)

        return Response(serializer.data)

    @action(
        detail=False,
        methods=["POST"],
        permission_classes=[IsAuthenticated],
        url_path="unregister-user",
    )
    def unregister_user(self, request):
        public_serial_number = request.data.get("public_serial_number")

        if not public_serial_number:
            return Response(
                {"error": "Public serial number is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            frame = Frame.objects.get(
                public_serial_number=public_serial_number,
                user=request.user,
                is_active=True,
            )
        except Frame.DoesNotExist:
            return Response(
                {"error": "Frame not found or invalid serial number."},
                status=status.HTTP_404_NOT_FOUND,
            )

        frame.user = None
        frame.save()

        serializer = FrameRetrieveSerializer(frame)

        return Response(serializer.data)

    @action(
        detail=False,
        methods=["POST"],
        permission_classes=[IsAuthenticated],
        url_path="send-image",
    )
    def send_image(self, request):
        reciever_username = request.data.get("reciever_username")
        image_id = request.data.get("image_id")
        expiry_unix_timestamp = request.data.get("expiry_unix_timestamp")
        scheduled_unix_timestamp = request.data.get("scheduled_unix_timestamp")
        user = request.user

        if not reciever_username:
            return Response(
                {"error": "Reciever username is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not image_id:
            return Response(
                {"error": "Image id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            expiry_datetime = _parse_future_unix_timestamp(expiry_unix_timestamp)
            scheduled_for = _parse_future_unix_timestamp(scheduled_unix_timestamp)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if expiry_datetime is None:
            expiry_unix_timestamp = None

        if scheduled_for is not None:
            max_scheduled_for = now() + timedelta(
                days=settings.SENT_IMAGE_MAX_SCHEDULE_DAYS
            )
            if scheduled_for > max_scheduled_for:
                return Response(
                    {"error": "The scheduled time is too far in the future."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if expiry_datetime is not None and expiry_datetime <= scheduled_for:
                return Response(
                    {"error": "The expiry must be after the scheduled time."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            image = Image.objects.get(id=image_id, user=user, markedAsDeleted=False)
        except Image.DoesNotExist:
            return Response(
                {
                    "error": "Image not found, invalid image id, or no permission to access."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        not_found_error_message = (
            "Reciever not found, invalid reciever id, or non existing friendship."
        )

        try:
            reciever = User.objects.get(username=reciever_username)
        except User.DoesNotExist:
            return Response(
                {"error": not_found_error_message},
                status=status.HTTP_404_NOT_FOUND,
            )

        if reciever != user:
            try:
                Friendship.objects.get(
                    (Q(sender=user) & Q(reciever=reciever))
                    | (Q(sender=reciever) & Q(reciever=user)),
                    status="accepted",
                )
            except Friendship.DoesNotExist:
                return Response(
                    {"error": not_found_error_message},
                    status=status.HTTP_404_NOT_FOUND,
                )

        if scheduled_for is not None:
            sent_image = SentImage.objects.create(
                sender=user,
                reciever=reciever,
                image=image,
                status=SentImageStatus.SCHEDULED,
                scheduled_for=scheduled_for,
                expires_at=expiry_datetime,
            )
            return Response(
                SentImagesRetrieveSerializer(sent_image).data,
                status=status.HTTP_201_CREATED,
            )

        try:
            async_to_sync(FrameWebSocketConsumer.send_picture_to_user_frames)(
                sender=user,
                reciever=reciever,
                image=image,
                expiry_unix_timestamp=expiry_unix_timestamp,
                expiry_datetime=expiry_datetime,
            )

        except Exception:
            return Response(
                {"error": "Error sending the image."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        record_send(user, reciever)
        return Response(
            {"message": "Image sent successful."}, status=status.HTTP_200_OK
        )

    # ------- LEGACY
    @action(
        detail=False,
        methods=["POST"],
        permission_classes=[AllowAny],
        url_path="obtain-frame-ws-auth-token",
        throttle_classes=[],
    )
    def obtain_frame_ws_auth_token(self, request):
        private_serial_number = request.data.get("private_serial_number")

        if not private_serial_number:
            return Response(
                {"error": "Private serial number is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            frame = Frame.objects.get(private_serial_number=private_serial_number)
        except Frame.DoesNotExist:
            return Response(
                {"error": "Frame not found or invalid serial number."},
                status=status.HTTP_404_NOT_FOUND,
            )

        frame_token = frame.get_or_create_token()
        frame_token.last_obtained = timezone.now()
        frame_token.save()

        return Response(
            {
                "access_token": frame_token.access_token,
                "expires_at": frame_token.access_token_expires_at,
            }
        )

    @action(
        detail=False,
        methods=["POST"],
        authentication_classes=[FrameSignatureAuthentication],
        permission_classes=[IsAuthenticated],
        throttle_classes=[FrameBurstRateThrottle, FrameSustainedRateThrottle],
        url_path="obtain-frame-token",
    )
    def obtain_frame_token(self, request):
        return self._issue_token(request.auth)

    # ------- LEGACY (HMAC). Deletable once no legacy boards remain.
    @action(
        detail=False,
        methods=["POST"],
        authentication_classes=[FrameHTTPAuthentication],
        permission_classes=[IsAuthenticated],
        throttle_classes=[FrameBurstRateThrottle, FrameSustainedRateThrottle],
        url_path="obtain-frame-auth-token",
    )
    def obtain_frame_auth_token(self, request):
        return self._issue_token(request.auth)

    # ------- LEGACY
    @action(
        detail=False,
        methods=["POST"],
        permission_classes=[AllowAny],
        url_path="verify-frame-token",
        throttle_classes=[],
    )
    def verify_frame_token(self, request):
        access_token = request.data.get("access_token")

        if not access_token:
            return Response(
                {"error": "Access token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            frame_token = FrameToken.objects.get(access_token=access_token)
        except FrameToken.DoesNotExist:
            return Response(
                {"error": "Invalid access token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not frame_token.is_access_token_valid():
            return Response(
                {"error": "Access token has expired."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(
            {
                "valid": True,
            }
        )

    # TODO also use FrameSignatureAuthentication in future here not AllowAny
    @action(
        detail=False,
        methods=["POST"],
        permission_classes=[AllowAny],
        url_path="verify-frame-auth-token",
    )
    def verify_frame_auth_token(self, request):
        access_token = request.data.get("access_token")

        if not access_token:
            return Response(
                {"error": "Access token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            frame_token = FrameToken.objects.get(access_token=access_token)
        except FrameToken.DoesNotExist:
            return Response(
                {"error": "Invalid access token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not frame_token.is_access_token_valid():
            return Response(
                {"error": "Access token has expired."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(
            {
                "valid": True,
            }
        )

    @action(
        detail=True,
        methods=["POST"],
        permission_classes=[IsAuthenticated],
        url_path="obtain-frame-otp",
    )
    def obtain_frame_otp(self, request, pk=None):
        try:
            frame = self.get_queryset().get(pk=pk)
        except Frame.DoesNotExist:
            return Response(
                {"error": "Frame not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        expiry_minutes = os.environ.get("DJANGO_FRAME_OTP_EXPIRY_MINUTES", 10)
        otp = frame.generate_otp(expiry_minutes=expiry_minutes)

        return Response(
            {"otp": otp, "expires_in_minutes": expiry_minutes},
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["POST"],
        authentication_classes=[FrameTokenAuthentication],
        permission_classes=[IsAuthenticated],
        throttle_classes=[FrameBurstRateThrottle, FrameSustainedRateThrottle],
        url_path="verify-otp",
    )
    def verify_otp(self, request):
        frame: Frame = request.auth

        otp_code = request.data.get("otp")

        if not otp_code:
            return Response(
                {"error": "OTP is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not frame.verify_otp(otp_code):
            return Response(
                {"error": "OTP invalid or expired."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response({"valid": True})

    # ------- LEGACY (returns secure_payload). Deletable once no legacy boards remain.
    @action(
        detail=False,
        methods=["POST"],
        authentication_classes=[FrameTokenAuthentication],
        permission_classes=[IsAuthenticated],
        throttle_classes=[FrameBurstRateThrottle, FrameSustainedRateThrottle],
        url_path="verify-frame-otp",
    )
    def verify_frame_otp(self, request):
        frame: Frame = request.auth

        otp_code = request.data.get("otp")

        if not otp_code:
            return Response(
                {"error": "OTP is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_valid = frame.verify_otp(otp_code)

        if not is_valid:
            return Response(
                {"error": "OTP invalid or expired."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        secure_payload = SecurePayload.encrypt(
            payload={"valid": True}, secret=settings.FRAME_AUTH_SECRET_KEY
        )

        return Response({"secure_payload": secure_payload})

    @action(
        detail=False,
        methods=["POST"],
        authentication_classes=[FrameTokenAuthentication],
        permission_classes=[IsAuthenticated],
        throttle_classes=[FrameBurstRateThrottle, FrameSustainedRateThrottle],
        # TODO: fix rename url
        url_path="frame-hearbeat",
    )
    def frame_hearbeat(self, request):
        frame: Frame = request.auth

        local_ip_address = request.data.get("local_ip_address")
        version = request.data.get("version")

        if not local_ip_address:
            return Response(
                {"error": "local_ip_address is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not version:
            return Response(
                {"error": "version is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        frame.local_ip_address = local_ip_address
        frame.version = version
        frame.last_seen = frame.last_heartbeat = timezone.now()
        frame.last_telemetry = {
            key: value for key, value in request.data.items() if key != "events"
        }

        frame.save(
            update_fields=[
                "local_ip_address",
                "version",
                "last_seen",
                "last_heartbeat",
                "last_telemetry",
            ]
        )

        # One line per device event so Grafana can list them without unpacking the body.
        for event in request.data.get("events") or []:
            if isinstance(event, dict):
                telemetry_logger.info(
                    json.dumps(
                        {
                            "kind": "event",
                            "serial_number": frame.public_serial_number,
                            **{
                                key: event.get(key)
                                for key in ("seq", "time", "source", "message")
                            },
                        }
                    )
                )

        return Response({"message": "Recieved heartbeat."}, status=status.HTTP_200_OK)

    @no_logging(log_body=False, silent=True)
    @action(
        detail=False,
        methods=["POST"],
        authentication_classes=[FrameTokenAuthentication],
        permission_classes=[IsAuthenticated],
        throttle_classes=[FrameBurstRateThrottle, FrameSustainedRateThrottle],
        url_path="frame-diagnostics",
    )
    def frame_diagnostics(self, request):
        frame: Frame = request.auth
        body = request.body

        if len(body) > DIAGNOSTICS_MAX_UPLOAD_BYTES:
            return Response(
                {"error": "Diagnostics package too large."},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )

        trigger = request.query_params.get("trigger")
        if trigger not in FrameDiagnostics.Trigger.values:
            return Response(
                {"error": "Unknown trigger."}, status=status.HTTP_400_BAD_REQUEST
            )

        command = None
        command_id = request.query_params.get("command_id", "")
        if command_id.isdigit():
            command = FrameCommand.objects.filter(pk=command_id, frame=frame).first()

        # Bounded inflate: the upload cap says nothing about the unpacked size.
        inflater = zlib.decompressobj(wbits=31)
        try:
            text = inflater.decompress(body, DIAGNOSTICS_MAX_TEXT_BYTES)
        except zlib.error:
            return Response(
                {"error": "Not a gzip package."}, status=status.HTTP_400_BAD_REQUEST
            )
        if inflater.unconsumed_tail:
            return Response(
                {"error": "Diagnostics package too large."},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )
        if not inflater.eof:
            return Response(
                {"error": "Truncated gzip package."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        diagnostics = FrameDiagnostics(
            frame=frame, command=command, trigger=trigger, size=len(body)
        )
        diagnostics.file.save("diagnostics.gz", ContentFile(body), save=True)

        for line in text.decode("utf-8", "replace").splitlines():
            telemetry_logger.info(
                json.dumps(
                    {
                        "kind": "diagnostics",
                        "serial_number": frame.public_serial_number,
                        "diagnostics_id": diagnostics.pk,
                        "line": line,
                    }
                )
            )

        return Response({"id": diagnostics.pk}, status=status.HTTP_201_CREATED)
