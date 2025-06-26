from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework.decorators import action
from django.utils import timezone
from asgiref.sync import async_to_sync
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination
from config.throttles import BurstRateThrottle, SustainedRateThrottle
from frames.consumers import FrameWebSocketConsumer
from .models import SentImage
from .serializers import (
    SentImagesRetrieveSerializer,
)


class SentImagesPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50


class SentImagesViewSet(viewsets.ModelViewSet):
    queryset = SentImage.objects.all().order_by("-sent_at")
    http_method_names = ["get", "post", "head", "options"]
    permission_classes = [IsAuthenticated]
    serializer_class = SentImagesRetrieveSerializer
    throttle_classes = [BurstRateThrottle, SustainedRateThrottle]
    pagination_class = SentImagesPagination

    def get_queryset(self):
        queryset = self.queryset.filter(
            Q(sender=self.request.user) | Q(reciever=self.request.user)
        )

        # Apply filters from query parameters
        status_filter = self.request.query_params.get("status", "all")
        shipping_filter = self.request.query_params.get("shipping", "all")
        sender_filter = self.request.query_params.get("sender", "")
        receiver_filter = self.request.query_params.get("receiver", "")

        # Status filter (active/expired)
        if status_filter == "active":
            queryset = queryset.filter(expires_at__gt=timezone.now())
        elif status_filter == "expired":
            queryset = queryset.filter(expires_at__lte=timezone.now())

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

    @extend_schema(
        responses={200: SentImagesRetrieveSerializer(many=True)},
        parameters=[
            OpenApiParameter(
                name="status",
                description="Filter by image status",
                required=False,
                type=str,
                enum=["all", "active", "expired"],
            ),
            OpenApiParameter(
                name="shipping",
                description="Filter by shipping direction",
                required=False,
                type=str,
                enum=["all", "sentToYou", "sentByYou"],
            ),
            OpenApiParameter(
                name="sender",
                description='Filter by sender username (use "Du" for current user)',
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="receiver",
                description='Filter by receiver username (use "Du" for current user)',
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="page", description="Page number", required=False, type=int
            ),
            OpenApiParameter(
                name="page_size",
                description="Number of items per page (max 50)",
                required=False,
                type=int,
            ),
        ],
    )
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

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
