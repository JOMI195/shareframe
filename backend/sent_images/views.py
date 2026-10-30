import logging

from asgiref.sync import async_to_sync
from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from config.throttles import ImagesBurstRateThrottle, ImagesSustainedRateThrottle
from frames.consumers import FrameWebSocketConsumer
from images.models import prefetch_variants

from .delivery import deliver_scheduled_sent_image
from .models import SentImage, SentImageStatus
from .serializers import (
    SentImagesRetrieveSerializer,
)

logger = logging.getLogger(__name__)


class SentImagesPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 30


class SentImagesViewSet(viewsets.ModelViewSet):
    queryset = (
        SentImage.objects.select_related(
            "sender__account", "reciever__account", "image"
        )
        .prefetch_related(prefetch_variants("image__variants"))
        .order_by("-sent_at")
    )
    http_method_names = ["get", "post", "head", "options"]
    permission_classes = [IsAuthenticated]
    serializer_class = SentImagesRetrieveSerializer
    throttle_classes = [ImagesBurstRateThrottle, ImagesSustainedRateThrottle]
    pagination_class = SentImagesPagination

    def get_queryset(self):
        queryset = self.queryset.filter(
            Q(sender=self.request.user)
            | (Q(reciever=self.request.user) & Q(status=SentImageStatus.SENT))
        )

        # Apply filters from query parameters
        status_filter = self.request.query_params.get("status", "all")
        shipping_filter = self.request.query_params.get("shipping", "all")
        sender_filter = self.request.query_params.get("sender", "")
        receiver_filter = self.request.query_params.get("receiver", "")

        if status_filter == "active":
            queryset = queryset.sent().filter(expires_at__gt=timezone.now())
        elif status_filter == "expired":
            queryset = queryset.sent().filter(expires_at__lte=timezone.now())
        elif status_filter == "scheduled":
            queryset = queryset.scheduled()

        # Shipping filter (sent to you / sent by you)
        if shipping_filter == "sentToYou":
            queryset = queryset.filter(reciever=self.request.user)
        elif shipping_filter == "sentByYou":
            queryset = queryset.filter(sender=self.request.user)

        # Sender filter
        if sender_filter:
            # Handle case where frontend sends "Du" for current user
            if sender_filter.lower() == "du":
                queryset = queryset.filter(sender=self.request.user)
            else:
                queryset = queryset.filter(sender__username__icontains=sender_filter)

        # Receiver filter
        if receiver_filter:
            # Handle case where frontend sends "Du" for current user
            if receiver_filter.lower() == "du":
                queryset = queryset.filter(reciever=self.request.user)
            else:
                queryset = queryset.filter(
                    reciever__username__icontains=receiver_filter
                )

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

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

    def create(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=True, methods=["POST"], url_path="deactivate-sent-image")
    def deactivate_sent_image(self, request, pk=None):
        try:
            sent_image = self.get_queryset().sent().get(pk=pk)

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
        except Exception:
            logger.exception("Deactivating sent image %s failed", pk)
            return Response(
                {"detail": "An error occurred while deactivating the image."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def _own_scheduled(self, pk):
        return SentImage.objects.scheduled().filter(pk=pk, sender=self.request.user)

    @action(detail=True, methods=["POST"], url_path="cancel-scheduled")
    def cancel_scheduled(self, request, pk=None):
        deleted, _ = self._own_scheduled(pk).delete()
        if not deleted:
            return Response(
                {"detail": "Scheduled sent image not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["POST"], url_path="send-now")
    def send_now(self, request, pk=None):
        sent_image_id = self._own_scheduled(pk).values_list("id", flat=True).first()
        sent_image = (
            deliver_scheduled_sent_image(sent_image_id, early=True)
            if sent_image_id is not None
            else None
        )
        if sent_image is None:
            return Response(
                {"detail": "Scheduled sent image not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(self.get_serializer(sent_image).data)
