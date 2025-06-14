from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.db import models

from .models import Changelog
from .serializers import ChangelogIdSerializer, ChangelogsSerializer
from frames.models import Frame


class ChangelogViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        """Filter changelogs based on the authenticated user's connected frames' groups"""
        base_queryset = Changelog.objects.filter(is_published=True)

        user_frames = self._get_user_frames(self.request.user)

        if user_frames.exists():
            user_frame_groups = self._get_frame_groups_for_frames(user_frames)

            if user_frame_groups.exists():
                # Return changelogs that have at least one group that matches the user's frames' groups
                return base_queryset.filter(
                    models.Q(groups__in=user_frame_groups)
                ).distinct()
            else:
                Changelog.objects.none()

        return Changelog.objects.none()

    def _get_user_frames(self, user):
        """Get all frames connected to the authenticated user"""
        return Frame.objects.filter(user=user, is_active=True)

    def _get_frame_groups_for_frames(self, frames):
        """Get all unique groups from the provided frames"""
        from frames.models import FrameGroup

        return FrameGroup.objects.filter(frames__in=frames).distinct()

    def get_serializer_class(self):
        if self.action == "list_ids":
            return ChangelogIdSerializer
        return ChangelogsSerializer

    @extend_schema(
        summary="List all changelog IDs",
        description="Returns only the IDs, dates, and titles of all published changelog entries",
        responses={200: ChangelogIdSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], url_path="ids")
    def list_ids(self, request):
        queryset = self.get_queryset()
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

        entries = self.get_queryset().filter(id__in=ids)

        if not entries:
            return Response(
                {
                    "error": "No changelog entries found for the provided IDs or you don't have access to them"
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ChangelogsSerializer(
            entries, many=True, context={"request": request}
        )
        return Response(serializer.data)
