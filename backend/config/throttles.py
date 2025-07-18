from rest_framework.throttling import UserRateThrottle


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
