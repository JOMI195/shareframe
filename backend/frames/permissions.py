from rest_framework.permissions import BasePermission

from .models import Frame


class IsSignedFrame(BasePermission):
    """Lets an unowned frame through too, so the view can hand it a claim code."""

    def has_permission(self, request, view):
        return isinstance(request.auth, Frame)
