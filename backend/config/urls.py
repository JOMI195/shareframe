from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from .views import MediaAccessView

urlpatterns = [
    # general
    path("api/admin/", admin.site.urls),
    # path("api/auth/", include("djoser.urls")),
    path("api/auth/", include("authentication.urls")),
    path("api/auth/", include("djoser.urls.jwt")),
    # apps
    path("api/", include("images.urls")),
]

if not bool(settings.DEBUG):
    urlpatterns.append(
        re_path(
            r"^api/media/private/(?P<path>.*)$", MediaAccessView.as_view(), name="media"
        )
    )

if bool(settings.DEBUG):
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns.append(
        path("api/schema/docs/", SpectacularAPIView.as_view(), name="schema")
    )
    urlpatterns.append(
        path("api/schema/", SpectacularSwaggerView.as_view(url_name="schema"))
    )
