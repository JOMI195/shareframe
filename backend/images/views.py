from django.db import transaction
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from drf_spectacular.utils import extend_schema
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import NotFound
from config.throttles import BurstRateThrottle, SustainedRateThrottle

from .models import Image
from .serializers import (
    ImageCreateSerializer,
    ImageRetrieveSerializer,
    ImageDestroySerializer,
)
from sent_images.models import SentImage


class ImagesPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50


class ImagesViewSet(ModelViewSet):
    http_method_names = ["get", "post", "delete", "head", "options"]
    parser_classes = (MultiPartParser, FormParser)
    throttle_classes = [BurstRateThrottle, SustainedRateThrottle]
    pagination_class = ImagesPagination

    def get_serializer_class(self):
        if self.action == "list":
            return ImageRetrieveSerializer
        if self.action == "retrieve":
            return ImageRetrieveSerializer
        elif self.action == "create":
            return ImageCreateSerializer
        elif self.action == "destroy":
            return ImageDestroySerializer
        return self.serializer_class

    def get_permissions(self):
        if self.action == "create":
            self.permission_classes = [IsAuthenticated]
        elif self.action == "list":
            self.permission_classes = [IsAuthenticated]
        elif self.action == "retrieve":
            self.permission_classes = [IsAuthenticated]
        elif self.action == "destroy":
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    def get_queryset(self):
        return Image.objects.filter(
            user=self.request.user, markedAsDeleted=False
        ).order_by("-created_at")

    @extend_schema(
        responses={200: ImageRetrieveSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @extend_schema(
        responses={200: ImageRetrieveSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        try:
            element = Image.objects.get(
                pk=self.kwargs["pk"], user=request.user, markedAsDeleted=False
            )
        except Image.DoesNotExist:
            raise NotFound("Image not found or you don't have permission to view it.")

        serializer = self.get_serializer(element)
        return Response(serializer.data)

    @extend_schema(
        request=ImageCreateSerializer,
        responses={201: ImageRetrieveSerializer},
    )
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        request_data_updated = request.data.dict()
        request_data_updated = {
            **request_data_updated,
            "image": request.FILES.get("image"),
        }

        serializer = self.get_serializer(data=request_data_updated)
        serializer.is_valid(raise_exception=True)
        element = serializer.save()
        serializer = ImageRetrieveSerializer(element)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        request=ImageDestroySerializer,
        responses={200: ImageRetrieveSerializer},
    )
    def destroy(self, request, *args, **kwargs):
        pk_to_delete = self.kwargs["pk"]
        try:
            element = Image.objects.get(
                pk=pk_to_delete, user=request.user, markedAsDeleted=False
            )
        except Image.DoesNotExist:
            raise NotFound("Image not found or you don't have permission to delete it.")

        # dont delete images directly, instead mark them as deleted
        element.markedAsDeleted = True
        element.save()

        serializer = ImageRetrieveSerializer(element)
        return Response(serializer.data)
