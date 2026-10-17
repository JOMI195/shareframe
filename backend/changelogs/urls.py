from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import ChangelogViewSet

router = SimpleRouter()
router.register(r"changelogs", ChangelogViewSet, basename="changelog")

urlpatterns = [
    path("", include(router.urls)),
]
