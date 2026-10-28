from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from changelogs.models import ChangelogImage
from config.throttles import (
    ChangelogsBurstRateThrottle,
    ChangelogsSustainedRateThrottle,
    FrameUpdatesBurstRateThrottle,
    FrameUpdatesSustainedRateThrottle,
    MediaBurstRateThrottle,
    MediaSustainedRateThrottle,
)
from frame_updates.models import Release
from frames.auth import FrameTokenAuthentication
from frames.models import Frame, FrameGroup
from friendships.models import Friendship
from images.models import Image, ImageVariant
from sent_images.models import SentImage
from user_accounts.models import Account
from utils.request_logging.decorators import no_logging

# Revalidated on every view so revoked access applies at once; nginx answers 304.
PRIVATE_MEDIA_CACHE_CONTROL = "private, no-cache"


def stored_name(prefix, path):
    """The storage name for a requested media path, or None if it could escape."""
    if not path or "\x00" in path or "\\" in path or path.startswith("/"):
        return None
    if any(part in ("", ".", "..") for part in path.split("/")):
        return None
    return prefix + path


def protected_file(name, cache_control=None):
    response = Response(status=200)
    response["X-Accel-Redirect"] = "/api/media/protected/" + name
    if cache_control:
        response["Cache-Control"] = cache_control
    return response


class MediaAccessView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [MediaBurstRateThrottle, MediaSustainedRateThrottle]

    def get(self, request, path: str):
        name = stored_name("private/", path)
        image = self._find_image(name) if name else None

        if image is None or not self._check_user_access(
            image.user, request.user, image
        ):
            raise PermissionDenied("Media not found or not authorized to access.")

        return protected_file(name, cache_control=PRIVATE_MEDIA_CACHE_CONTROL)

    def _find_image(self, name):
        variant = (
            ImageVariant.objects.select_related("parent_image__user")
            .filter(file=name)
            .first()
        )
        if variant is not None:
            return variant.parent_image
        return Image.objects.select_related("user").filter(image=name).first()

    def _check_user_access(self, owner, user, image):
        """Check if user has access to image owned by owner"""
        # Direct ownership
        if owner == user:
            return True

        # Check if the image was sent to/from this user
        sentImage_exists = (
            SentImage.objects.sent()
            .filter(
                (
                    (Q(sender=user) & Q(reciever=owner))
                    | (Q(sender=owner) & Q(reciever=user))
                )
                & Q(image=image)
            )
            .exists()
        )

        return sentImage_exists


class AvatarAccessView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [MediaBurstRateThrottle, MediaSustainedRateThrottle]

    def get(self, request, path: str):
        user = request.user
        account = (
            Account.objects.filter(avatar=f"avatars/{path}")
            .select_related("user")
            .first()
        )

        if account is None or not self._may_see(user, account.user):
            raise PermissionDenied("Media not found or not authorized to access.")

        return protected_file(
            f"avatars/{path}", cache_control=PRIVATE_MEDIA_CACHE_CONTROL
        )

    def _may_see(self, user, owner):
        if user.is_staff or user == owner:
            return True
        between = (Q(sender=user) & Q(reciever=owner)) | (
            Q(sender=owner) & Q(reciever=user)
        )
        return (
            Friendship.objects.filter(between).exists()
            or SentImage.objects.filter(between).exists()
        )


class FrameUpdatesAccessView(APIView):
    authentication_classes = [FrameTokenAuthentication]
    permission_classes = [IsAuthenticated]
    throttle_classes = [
        FrameUpdatesBurstRateThrottle,
        FrameUpdatesSustainedRateThrottle,
    ]

    def get(self, request, path: str):
        user = request.user
        frame: Frame | None = getattr(request, "auth", None)

        if path.strip() == "":
            raise PermissionDenied("No valid path")

        if not user.is_authenticated:
            raise PermissionDenied("Media not found or not authorized to access.")

        if not frame or not frame.groups.exists():
            raise PermissionDenied("Frame has no valid groups assigned.")

        name = stored_name("frame-updates/", path)
        if (
            not name
            or not Release.objects.filter(
                is_active=True, groups__in=frame.groups.all(), file=name
            ).exists()
        ):
            raise PermissionDenied("File not found or not authorized to access.")

        frame.last_update_attempt = timezone.now()
        frame.save(update_fields=["last_update_attempt"])

        return protected_file(name)


class ChangelogsAccessView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ChangelogsBurstRateThrottle, ChangelogsSustainedRateThrottle]

    def get(self, request, path: str):
        user = request.user

        if path.strip() == "":
            raise PermissionDenied("No valid path")

        if not user.is_authenticated:
            raise PermissionDenied("Media not found or not authorized to access.")

        user_frames = Frame.objects.filter(user=user, is_active=True)

        if not user_frames.exists():
            raise PermissionDenied("User has no connected frames.")

        user_frame_groups = set(FrameGroup.objects.filter(frames__in=user_frames))

        if not user_frame_groups:
            raise PermissionDenied("User's frames have no valid groups assigned.")

        name = stored_name("changelogs/", path)
        changelog_images = (
            ChangelogImage.objects.filter(image=name, changelog__is_published=True)
            .select_related("changelog")
            .prefetch_related("changelog__groups")
            if name
            else []
        )

        for changelog_image in changelog_images:
            changelog_groups = set(changelog_image.changelog.groups.all())
            if not changelog_groups or user_frame_groups & changelog_groups:
                return protected_file(name, cache_control=PRIVATE_MEDIA_CACHE_CONTROL)

        raise PermissionDenied("File not found or not authorized to access.")


class HealthView(APIView):
    # Polled by Docker and by clients during an outage, so it stays cheap and unthrottled.
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = []

    @no_logging(value=True, silent=True)
    def get(self, request):
        return Response({"status": "ok"})
