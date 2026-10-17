from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import ImagesViewSet, TextPresetsViewSet

router = SimpleRouter()
router.register(r"images", ImagesViewSet, basename="images")
router.register(r"text-presets", TextPresetsViewSet, basename="text-presets")

urlpatterns = [
    path("", include(router.urls)),
]
