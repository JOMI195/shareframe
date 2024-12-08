from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ImagesViewSet

router = DefaultRouter()
router.register(r"images", ImagesViewSet, basename="images")

urlpatterns = [
    path("", include(router.urls)),
]
