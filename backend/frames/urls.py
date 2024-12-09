from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FramesViewSet

router = DefaultRouter()
router.register("frames", FramesViewSet, basename="frames")

urlpatterns = [
    path("", include(router.urls)),
]
