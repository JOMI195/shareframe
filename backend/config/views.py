from typing import List

from frames.auth import FrameTokenAuthentication
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.conf import settings
from django.db.models import Q

from images.models import Image, ImageVariant
from sent_images.models import SentImage


class MediaAccessView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, path: str):
        user = request.user

        if path.strip() == "":
            raise PermissionDenied("No valid path")

        if not user.is_authenticated:
            raise PermissionDenied("Media not found or not authorized to access.")

        access_granted = False

        if user.is_staff:
            access_granted = True
        else:
            access_granted = self._check_path_access(path, user)

        if access_granted:
            response = Response(status=200)
            # nginx proxy_pass: /app/backend/mediafiles/private/
            response["X-Accel-Redirect"] = "/api/media/protected/private/" + path
            return response
        else:
            raise PermissionDenied("Media not found or not authorized to access.")

    def _normalize_path(self, url_path):
        """Normalize a media URL to a comparable path"""
        normalized = url_path.replace(settings.MEDIA_URL + "private/", "")
        return normalized

    def _check_user_access(self, owner, user, image):
        """Check if user has access to image owned by owner"""
        # Direct ownership
        if owner == user:
            return True

        # Check if the image was sent to/from this user
        sentImage_exists = SentImage.objects.filter(
            (
                (Q(sender=user) & Q(reciever=owner))
                | (Q(sender=owner) & Q(reciever=user))
            )
            & Q(image=image)
        ).exists()

        return sentImage_exists

    def _check_path_access(self, path, user):
        """Check if user has access to the given path"""
        variants = ImageVariant.objects.all()
        for variant in variants:
            doc_path = self._normalize_path(variant.file.url)

            if path.endswith("/"):
                doc_path = doc_path + "/"

            if path == doc_path:
                parent_image = variant.parent_image
                if self._check_user_access(parent_image.user, user, parent_image):
                    return True

        images = Image.objects.all()
        for image in images:
            doc_path = self._normalize_path(image.image.url)

            if path.endswith("/"):
                doc_path = doc_path + "/"

            if path == doc_path:
                if self._check_user_access(image.user, user, image):
                    return True

        return False


class FrameUpdatesAccessView(APIView):
    authentication_classes = [FrameTokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, path: str):
        user = request.user

        if path.strip() == "":
            raise PermissionDenied("No valid path")

        if not user.is_authenticated:
            raise PermissionDenied("Media not found or not authorized to access.")

        response = Response(status=200)
        # nginx proxy_pass: /app/backend/mediafiles/frame-updates/
        response["X-Accel-Redirect"] = "/api/media/protected/frame-updates/" + path
        return response
