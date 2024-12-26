from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from django.utils import timezone
from asgiref.sync import async_to_sync
from django.db.models import Q
from config.throttles import BurstRateThrottle, SustainedRateThrottle
from frames.consumers import FrameWebSocketConsumer
from .models import SentImage
from .serializers import (
    SentImagesRetrieveSerializer,
)


class SentImagesViewSet(viewsets.ModelViewSet):
    queryset = SentImage.objects.all().order_by("-sent_at")
    http_method_names = ["get", "post", "head", "options"]
    permission_classes = [IsAuthenticated]
    serializer_class = SentImagesRetrieveSerializer
    throttle_classes = [BurstRateThrottle, SustainedRateThrottle]

    def get_queryset(self):
        return self.queryset.filter(
            Q(sender=self.request.user) | Q(reciever=self.request.user)
        )

    @extend_schema(
        responses={200: SentImagesRetrieveSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        responses={200: SentImagesRetrieveSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        try:
            element = self.get_queryset().get(pk=self.kwargs["pk"])
        except SentImage.DoesNotExist:
            return Response(
                {
                    "detail": "Sent image entry not found or you don't have permission to view it."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(element)
        return Response(serializer.data)

    @extend_schema(exclude=True)
    def create(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @extend_schema(
        responses={200: SentImagesRetrieveSerializer},
    )
    @action(detail=True, methods=["POST"], url_path="deactivate-sent-image")
    def deactivate_sent_image(self, request, pk=None):
        try:
            sent_image = self.get_queryset().get(pk=pk)

            sent_image.expires_at = timezone.now() - timezone.timedelta(seconds=60)
            sent_image.save()

            async_to_sync(
                FrameWebSocketConsumer.send_clear_specific_images_to_user_frames
            )(receiver=sent_image.reciever, sent_image_ids=[sent_image.id])

            serializer = self.get_serializer(sent_image)
            return Response(serializer.data)

        except SentImage.DoesNotExist:
            return Response(
                {
                    "detail": "Sent image not found or you don't have permission to deactivate it."
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response(
                {"detail": f"An error occurred while deactivating the image.{e}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
