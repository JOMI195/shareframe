from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
import semver

from config.throttles import FrameBurstRateThrottle, FrameSustainedRateThrottle
from frames.auth import FrameTokenAuthentication
from frames.models import Frame, FrameGroup
from .models import Release
from .serializers import (
    ReleaseSerializer,
    VersionListSerializer,
)


class UpdateAPIViewSet(viewsets.ViewSet):
    authentication_classes = [FrameTokenAuthentication]
    permission_classes = [IsAuthenticated]
    throttle_classes = [FrameBurstRateThrottle, FrameSustainedRateThrottle]

    def _get_frame_from_request(self, request) -> Frame | None:
        """Get the frame from the authenticated request"""
        return getattr(request, "auth", None)

    def _get_ordered_releases(self, frame: Frame | None = None):
        """Get releases filtered by frame's groups"""
        releases = Release.objects.filter(is_active=True)

        if frame:
            frame_groups = frame.groups.all()
            if frame_groups.exists():
                releases = releases.filter(groups__in=frame_groups).distinct()
            else:
                releases = Release.objects.none()

        return sorted(
            releases, key=lambda r: semver.VersionInfo.parse(r.version), reverse=True
        )

    def list_versions(self, request):
        frame = self._get_frame_from_request(request)
        ordered_releases = self._get_ordered_releases(frame)
        versions = [release.version for release in ordered_releases]
        serializer = VersionListSerializer({"versions": versions})
        return Response(serializer.data)

    def get_latest(self, request):
        frame = self._get_frame_from_request(request)
        ordered_releases = self._get_ordered_releases(frame)
        if not ordered_releases:
            return Response({"error": "No releases found"}, status=404)

        latest_release = ordered_releases[0]
        serializer = ReleaseSerializer(latest_release, context={"request": request})
        return Response(serializer.data)

    def get_version(self, request, version):
        frame = self._get_frame_from_request(request)

        releases = Release.objects.filter(
            is_active=True, version=version, groups__isnull=False
        )

        if frame:
            frame_groups = frame.groups.all()
            if frame_groups.exists():
                releases = releases.filter(groups__in=frame_groups)
            else:
                releases = Release.objects.none()

        release = get_object_or_404(releases.distinct())
        serializer = ReleaseSerializer(release, context={"request": request})
        return Response(serializer.data)
