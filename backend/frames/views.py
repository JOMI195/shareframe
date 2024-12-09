from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.permissions import IsAuthenticated, AllowAny
from drf_spectacular.utils import extend_schema

from .models import Frame


class FramesViewSet(viewsets.ModelViewSet):
    http_method_names = ["get", "post", "head", "options"]
    queryset = Frame.objects.all().order_by("-registered_at")

    @extend_schema(exclude=True)
    def list(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @extend_schema(exclude=True)
    def retrieve(self, request, *args, **kwargs):
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
