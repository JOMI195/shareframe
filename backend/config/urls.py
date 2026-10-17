from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from django_otp.admin import OTPAdminSite
from rest_framework_simplejwt.views import TokenVerifyView

from authentication.jwt import (
    CookieTokenObtainPairView,
    CookieTokenRefreshView,
    CSRFView,
    LogoutView,
)
from metrics.views import business_metrics_view, metrics_view

from .views import (
    AvatarAccessView,
    ChangelogsAccessView,
    FrameUpdatesAccessView,
    MediaAccessView,
    VersionView,
)

if bool(settings.PRODUCTION):
    admin.site.__class__ = OTPAdminSite

admin.site.site_title = "Shareframe administration"
admin.site.site_header = "Shareframe"
admin.site.index_title = "Site administration"

handler400 = "config.errors.bad_request"
handler403 = "config.errors.permission_denied"
handler404 = "config.errors.page_not_found"
handler500 = "config.errors.server_error"

urlpatterns = [
    # not exposed through nginx
    path("metrics", metrics_view, name="prometheus-metrics"),
    path("metrics/business", business_metrics_view, name="prometheus-metrics-business"),
    # general
    path("api/admin/", admin.site.urls),
    # path("api/auth/", include("djoser.urls")),
    path("api/auth/", include("authentication.urls")),
    path("api/auth/csrf/", CSRFView.as_view(), name="csrf"),
    path(
        "api/auth/jwt/create/", CookieTokenObtainPairView.as_view(), name="jwt-create"
    ),
    path("api/auth/jwt/refresh/", CookieTokenRefreshView.as_view(), name="jwt-refresh"),
    path("api/auth/jwt/logout/", LogoutView.as_view(), name="jwt-logout"),
    path("api/auth/jwt/verify/", TokenVerifyView.as_view(), name="jwt-verify"),
    # apps
    path("api/version/", VersionView.as_view(), name="app-version"),
    path("api/", include("frames.urls")),
    path("api/", include("frame_updates.urls")),
    path("api/", include("images.urls")),
    path("api/", include("sent_images.urls")),
    path("api/", include("friendships.urls")),
    path("api/", include("changelogs.urls")),
    path("api/", include("dashboard.urls")),
    path("api/", include("notifications.urls")),
    path("api/", include("user_accounts.urls")),
]

if not bool(settings.DEBUG):
    urlpatterns.append(
        re_path(
            r"^api/media/private/(?P<path>.*)$",
            MediaAccessView.as_view(),
            name="media",
        )
    )
    urlpatterns.append(
        re_path(
            r"^api/media/avatars/(?P<path>.*)$",
            AvatarAccessView.as_view(),
            name="avatars-media",
        )
    )
    urlpatterns.append(
        re_path(
            r"^api/media/frame-updates/(?P<path>.*)$",
            FrameUpdatesAccessView.as_view(),
            name="frame-updates-media",
        )
    )
    urlpatterns.append(
        re_path(
            r"^api/media/changelogs/(?P<path>.*)$",
            ChangelogsAccessView.as_view(),
            name="changelogs-media",
        )
    )

if bool(settings.DEBUG):
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
