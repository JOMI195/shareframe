from rest_framework.throttling import UserRateThrottle, SimpleRateThrottle


class BurstRateThrottle(UserRateThrottle):
    scope = "burst"


class SustainedRateThrottle(UserRateThrottle):
    scope = "sustained"


# images
class ImagesBurstRateThrottle(UserRateThrottle):
    scope = "images_burst"


class ImagesSustainedRateThrottle(UserRateThrottle):
    scope = "images_sustained"


# media access
class MediaBurstRateThrottle(UserRateThrottle):
    scope = "media_burst"


class MediaSustainedRateThrottle(UserRateThrottle):
    scope = "media_sustained"


class FrameUpdatesBurstRateThrottle(UserRateThrottle):
    scope = "frame_updates_burst"


class FrameUpdatesSustainedRateThrottle(UserRateThrottle):
    scope = "frame_updates_sustained"


class ChangelogsBurstRateThrottle(UserRateThrottle):
    scope = "changelogs_burst"


class ChangelogsSustainedRateThrottle(UserRateThrottle):
    scope = "changelogs_sustained"


class _FrameScopedThrottle(SimpleRateThrottle):
    """Key on the authenticated frame (request.auth), not the frame's owner user."""

    def get_cache_key(self, request, view):
        frame = getattr(request, "auth", None)
        ident = getattr(frame, "pk", None)
        if ident is None:
            return None
        return self.cache_format % {"scope": self.scope, "ident": ident}


class FrameBurstRateThrottle(_FrameScopedThrottle):
    scope = "frame_burst"


class FrameSustainedRateThrottle(_FrameScopedThrottle):
    scope = "frame_sustained"
