from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import FramesViewSet

router = SimpleRouter()
router.register("frames", FramesViewSet, basename="frames")

urlpatterns = [
    path("", include(router.urls)),
]
