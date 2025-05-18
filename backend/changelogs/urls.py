from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChangelogViewSet

router = DefaultRouter()
router.register(r"changelogs", ChangelogViewSet, basename="changelog")

urlpatterns = [
    path("", include(router.urls)),
]
