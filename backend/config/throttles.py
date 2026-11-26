from rest_framework.throttling import SimpleRateThrottle, UserRateThrottle


class BurstRateThrottle(UserRateThrottle):
    scope = "burst"


class SustainedRateThrottle(UserRateThrottle):
    scope = "sustained"


# images
class ImagesBurstRateThrottle(UserRateThrottle):
    scope = "images_burst"


class ImagesSustainedRateThrottle(UserRateThrottle):
    scope = "images_sustained"


# Each upload re-encodes the photo and renders every variant.
class ImageUploadBurstRateThrottle(UserRateThrottle):
    scope = "image_upload_burst"


class ImageUploadSustainedRateThrottle(UserRateThrottle):
    scope = "image_upload_sustained"


# media access
class MediaBurstRateThrottle(UserRateThrottle):
    scope = "media_burst"


class MediaSustainedRateThrottle(UserRateThrottle):
    scope = "media_sustained"


class ChangelogsBurstRateThrottle(UserRateThrottle):
    scope = "changelogs_burst"


class ChangelogsSustainedRateThrottle(UserRateThrottle):
    scope = "changelogs_sustained"


# Low, so a claim code cannot be guessed.
class FrameClaimBurstRateThrottle(UserRateThrottle):
    scope = "frame_claim_burst"


class FrameClaimSustainedRateThrottle(UserRateThrottle):
    scope = "frame_claim_sustained"


class _IpScopedThrottle(SimpleRateThrottle):
    """Key on the client IP, signed in or not."""

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }


# Claim codes are shared by all unowned frames, so many accounts on one IP must not add up.
class FrameClaimIpBurstRateThrottle(_IpScopedThrottle):
    scope = "frame_claim_ip_burst"


class FrameClaimIpSustainedRateThrottle(_IpScopedThrottle):
    scope = "frame_claim_ip_sustained"


class UnsubscribeBurstRateThrottle(_IpScopedThrottle):
    scope = "unsubscribe_burst"


class UnsubscribeSustainedRateThrottle(_IpScopedThrottle):
    scope = "unsubscribe_sustained"


# Mail providers send these, so many recipients share a few IPs.
class OneClickUnsubscribeBurstRateThrottle(_IpScopedThrottle):
    scope = "unsubscribe_one_click_burst"


class OneClickUnsubscribeSustainedRateThrottle(_IpScopedThrottle):
    scope = "unsubscribe_one_click_sustained"


# Anyone can post the contact form, and each post sends a mail.
class ContactBurstRateThrottle(_IpScopedThrottle):
    scope = "contact_burst"


class ContactSustainedRateThrottle(_IpScopedThrottle):
    scope = "contact_sustained"


class _FailureOnlyIpThrottle(_IpScopedThrottle):
    """Only failures count; the caller records them via record_failure."""

    def throttle_success(self):
        return True

    def record_failure(self, request, view):
        if self.rate is None:
            return
        key = self.get_cache_key(request, view)
        now = self.timer()
        history = [t for t in self.cache.get(key, []) if t > now - self.duration]
        self.cache.set(key, [now, *history], self.duration)


class FailedLoginThrottle(_FailureOnlyIpThrottle):
    scope = "failed_login"


# Checked inside the authenticator, because DRF throttles never see a failed authentication.
class FailedFrameHmacThrottle(_FailureOnlyIpThrottle):
    scope = "failed_frame_hmac"


# Device endpoints that answer without any credentials.
class FrameAuthIpBurstRateThrottle(_IpScopedThrottle):
    scope = "frame_auth_ip_burst"


class FrameAuthIpSustainedRateThrottle(_IpScopedThrottle):
    scope = "frame_auth_ip_sustained"


class AuthEmailBurstRateThrottle(_IpScopedThrottle):
    scope = "auth_email_burst"


class AuthEmailSustainedRateThrottle(_IpScopedThrottle):
    scope = "auth_email_sustained"


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


class FrameUpdatesBurstRateThrottle(_FrameScopedThrottle):
    scope = "frame_updates_burst"


class FrameUpdatesSustainedRateThrottle(_FrameScopedThrottle):
    scope = "frame_updates_sustained"
