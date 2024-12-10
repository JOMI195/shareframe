from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from drf_spectacular.utils import extend_schema
from django.db.models import Q
from asgiref.sync import async_to_sync
from django.core.cache import cache
from django.conf import settings


from .models import Frame
from .serializers import FrameRetrieveSerializer
from .consumers import FrameWebSocketConsumer
from user_core.models import User
from friendships.models import Friendship
from images.models import Image


class FramesViewSet(viewsets.ModelViewSet):
    http_method_names = ["get", "post", "head", "options"]
    queryset = Frame.objects.all().order_by("-registered_at")

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
    def update(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @extend_schema(exclude=True)
    def partial_update(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @extend_schema(exclude=True)
    def destroy(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=False, methods=["POST"], permission_classes=[IsAuthenticated])
    def register_user(self, request):
        public_serial_number = request.data.get("public_serial_number")

        if not public_serial_number:
            return Response(
                {"error": "Public serial number is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            frame = Frame.objects.get(public_serial_number=public_serial_number)
        except Frame.DoesNotExist:
            return Response(
                {"error": "Frame not found or invalid serial number."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if frame.user:
            return Response(
                {"error": "Frame is already registered to a user."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        frame.user = request.user
        frame.save()

        return Response(
            {"message": "Frame successfully registered"}, status=status.HTTP_200_OK
        )

    @action(detail=False, methods=["POST"], permission_classes=[IsAuthenticated])
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

        return Response(
            {"message": "Frame successfully unregistered from user."},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["POST"], permission_classes=[AllowAny])
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

        frame_token = frame.create_or_update_tokens()
        frame_token.last_obtained = timezone.now()
        frame_token.save()

        return Response(
            {
                "access_token": frame_token.access_token,
                "expires_at": frame_token.access_token_expires_at,
            }
        )

    @action(detail=False, methods=["POST"], permission_classes=[IsAuthenticated])
    def send_image(self, request):
        COOLDOWN_PERIOD = settings.FRAME_SENT_IMAGE_COOLDOWN_PERIOD_SECONDS

        cache_key = f"image_send_cooldown_{request.user.id}"

        last_send_time = cache.get(cache_key)
        if last_send_time:
            time_since_last_send = (timezone.now() - last_send_time).total_seconds()
            if time_since_last_send < COOLDOWN_PERIOD:
                return Response(
                    {
                        "error": f"Please wait {COOLDOWN_PERIOD - int(time_since_last_send)} seconds before sending another image."
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

        reciever_username = request.data.get("reciever_username")
        image_id = request.data.get("image_id")
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
                user, reciever, image
            )
            cache.set(cache_key, timezone.now(), COOLDOWN_PERIOD)
        except:
            return Response(
                {"error": "Error sending the image."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"message": "Image sent successfully."}, status=status.HTTP_200_OK
        )
