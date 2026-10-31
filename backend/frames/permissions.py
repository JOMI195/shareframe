from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import BasePermission

from config import error_codes

from .models import Frame


class IsRegisteredFrame(BasePermission):
    """A signed frame without an owner gets its own code, so the board can ask to be registered."""

    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            return True
        if isinstance(request.auth, Frame):
            raise PermissionDenied(
                detail="Frame is not registered to a user.",
                code=error_codes.FRAME_UNREGISTERED,
            )
        return False
