from django.urls import path
from .views import UpdateAPIViewSet

URL_PATH = "frame-updates/"
urlpatterns = [
    path(
        f"{URL_PATH}versions",
        UpdateAPIViewSet.as_view({"get": "list_versions"}),
        name="version-list",
    ),
    path(
        f"{URL_PATH}latest",
        UpdateAPIViewSet.as_view({"get": "get_latest"}),
        name="latest-version",
    ),
    path(
        f"{URL_PATH}<str:version>",
        UpdateAPIViewSet.as_view({"get": "get_version"}),
        name="version-detail",
    ),
]
