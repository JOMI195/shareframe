from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import FramesViewSet

router = DefaultRouter()
router.register("frames", FramesViewSet, basename="frames")

urlpatterns = [
    path("", include(router.urls)),
]
