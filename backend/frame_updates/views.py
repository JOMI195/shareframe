from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
import semver

from frames.auth import FrameTokenAuthentication
from .models import Release
from .serializers import (
    ReleaseSerializer,
    VersionListSerializer,
)


class UpdateAPIViewSet(viewsets.ViewSet):
    authentication_classes = [FrameTokenAuthentication]
    permission_classes = [IsAuthenticated]

    def _get_ordered_releases(self):
        releases = Release.objects.filter(is_active=True)
        return sorted(
            releases, key=lambda r: semver.VersionInfo.parse(r.version), reverse=True
        )

    def list_versions(self, request):
        ordered_releases = self._get_ordered_releases()
        versions = [release.version for release in ordered_releases]
        serializer = VersionListSerializer({"versions": versions})
        return Response(serializer.data)

    def get_latest(self, request):
        ordered_releases = self._get_ordered_releases()
        if not ordered_releases:
            return Response({"error": "No releases found"}, status=404)

        latest_release = ordered_releases[0]
        serializer = ReleaseSerializer(latest_release, context={"request": request})
        return Response(serializer.data)

    def get_version(self, request, version):
        release = get_object_or_404(Release, version=version, is_active=True)
        serializer = ReleaseSerializer(release, context={"request": request})
        return Response(serializer.data)
