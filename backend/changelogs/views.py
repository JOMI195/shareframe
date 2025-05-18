from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from .models import Changelog
from .serializers import ChangelogIdSerializer, ChangelogsSerializer


class ChangelogViewSet(viewsets.GenericViewSet):
    queryset = Changelog.objects.filter(is_published=True)
    pagination_class = None

    def get_serializer_class(self):
        if self.action == "list_ids":
            return ChangelogIdSerializer
        return ChangelogsSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    @extend_schema(
        summary="List all changelog IDs",
        description="Returns only the IDs, dates, and titles of all published changelog entries",
        responses={200: ChangelogIdSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], url_path="ids")
    def list_ids(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get multiple changelog entries by IDs",
        description="Returns changelog entries for the provided list of IDs",
        request={
            "application/json": {
                "type": "object",
                "properties": {"ids": {"type": "array", "items": {"type": "string"}}},
            }
        },
        responses={200: ChangelogsSerializer(many=True)},
    )
    @action(detail=False, methods=["post"], url_path="by-ids")
    def get_by_ids(self, request):
        ids = request.data.get("ids", [])

        if not ids or not isinstance(ids, list):
            return Response(
                {
                    "error": "Request body must contain an 'ids' field with a list of changelog IDs"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Filter entries by the provided IDs and ensure they are published
        entries = Changelog.objects.filter(id__in=ids, is_published=True)

        if not entries:
            return Response(
                {"error": "No changelog entries found for the provided IDs"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ChangelogsSerializer(
            entries, many=True, context={"request": request}
        )
        return Response(serializer.data)
