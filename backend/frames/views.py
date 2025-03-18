import hmac
import os
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from drf_spectacular.utils import extend_schema
from django.db.models import Q
from asgiref.sync import async_to_sync
from datetime import datetime
from django.utils.timezone import make_aware, now

from config.throttles import BurstRateThrottle, SustainedRateThrottle
from .models import Frame, FrameToken
from .serializers import FrameRetrieveSerializer
from .consumers import FrameWebSocketConsumer
from user_core.models import User
from friendships.models import Friendship
from images.models import Image
from .auth import FrameHTTPAuth


class FramesViewSet(viewsets.ModelViewSet):
    http_method_names = ["get", "post", "head", "options"]
    queryset = Frame.objects.all().order_by("-registered_at")
    throttle_classes = [BurstRateThrottle, SustainedRateThrottle]

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
        return self.queryset.filter(user=self.request.user)

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
            element = Frame.objects.get(pk=self.kwargs["pk"], user=request.user)
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
            frame = Frame.objects.get(public_serial_number=public_serial_number)
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
                public_serial_number=public_serial_number, user=request.user
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

        if expiry_unix_timestamp:
            try:
                naive_datetime = datetime.fromtimestamp(float(expiry_unix_timestamp))
                expiry_datetime = make_aware(naive_datetime)

                if expiry_datetime <= now():
                    return Response(
                        {"error": "The provided timestamp must be in the future."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except (ValueError, OverflowError):
                return Response(
                    {"error": "Invalid Unix timestamp provided."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            expiry_unix_timestamp = None
            expiry_datetime = None

        try:
            image = Image.objects.get(id=image_id, user=user)
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

        try:
            async_to_sync(FrameWebSocketConsumer.send_picture_to_user_frames)(
                sender=user,
                reciever=reciever,
                image=image,
                expiry_unix_timestamp=expiry_unix_timestamp,
                expiry_datetime=expiry_datetime,
            )

        except:
            return Response(
                {"error": "Error sending the image."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"message": "Image sent successful."}, status=status.HTTP_200_OK
        )

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
        permission_classes=[AllowAny],
        url_path="obtain-frame-auth-token",
    )
    def obtain_frame_auth_token(self, request):
        is_authenticated, result = FrameHTTPAuth().authenticate_frame_from_headers(
            request
        )

        if not is_authenticated:
            # If authentication failed, result is the error response
            return result

        matching_frame = result

        frame_token = matching_frame.get_or_create_token()
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

    @action(
        detail=False,
        methods=["POST"],
        permission_classes=[AllowAny],
        url_path="verify-frame-auth-token",
    )
    def verify_frame_auth_token(self, request):
        is_authenticated, result = FrameHTTPAuth().authenticate_frame_from_headers(
            request
        )

        if not is_authenticated:
            # If authentication failed, result is the error response
            return result

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
        permission_classes=[AllowAny],
        url_path="verify-frame-otp",
    )
    def verify_frame_otp(self, request):
        is_authenticated, result = FrameHTTPAuth().authenticate_frame_from_headers(
            request
        )

        if not is_authenticated:
            # If authentication failed, result is the error response
            return result

        frame = result

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

        return Response(
            {
                "valid": True,
            }
        )
