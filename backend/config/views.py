from typing import List
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.conf import settings

from images.models import Image


class MediaAccessView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, path: str):
        user = request.user

        if path.strip() == "":
            raise PermissionDenied("No valid path")

        if not user.is_authenticated:
            raise PermissionDenied("Not authenticated")

        access_granted = False

        if user.is_staff:
            access_granted = True
        else:
            user_images: List[Image] = user.images.all()

            for image in user_images:

                doc_path = image.image.url
                doc_path = doc_path.replace(settings.MEDIA_URL + "private/", "")
                if path.endswith("/"):
                    doc_path = doc_path + "/"

                if path == doc_path:
                    access_granted = True
                    break

        if access_granted:
            response = Response(status=200)
            # nginx proxy_pass: /app/backend/mediafiles/private/
            response["X-Accel-Redirect"] = "/api/media/protected/" + path
            return response
        else:
            raise PermissionDenied("Not authorized to access this media.")
