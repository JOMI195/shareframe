# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated
# from .authentication import FrameTokenAuthentication


# class FrameTokenProtectedView(APIView):

#     authentication_classes = [FrameTokenAuthentication]
#     permission_classes = [IsAuthenticated]

#     def get(self, request, *args, **kwargs):
#         frame_token = request.auth
#         frame = frame_token.frame

#         return Response(
#             {
#                 "message": "You have accessed this view using FrameToken!",
#                 "frame_id": frame.id,
#                 "public_serial_number": frame.public_serial_number,
#                 "user": frame.user.username if frame.user else None,
#             }
#         )


from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from frames.auth import FrameTokenAuthentication
from .models import Release
from .serializers import (
    ReleaseSerializer,
    VersionListSerializer,
)


class UpdateAPIViewSet(viewsets.ViewSet):
    authentication_classes = [FrameTokenAuthentication]
    permission_classes = [IsAuthenticated]

    def list_versions(self, request):
        versions = Release.objects.filter(is_active=True).values_list(
            "version", flat=True
        )
        serializer = VersionListSerializer({"versions": versions})
        return Response(serializer.data)

    def get_latest(self, request):
        latest_release = Release.objects.filter(is_active=True).first()
        if not latest_release:
            return Response({"error": "No releases found"}, status=404)

        serializer = ReleaseSerializer(latest_release)
        return Response(serializer.data)

    def get_version(self, request, version):
        release = get_object_or_404(Release, version=version, is_active=True)
        serializer = ReleaseSerializer(release)
        return Response(serializer.data)
