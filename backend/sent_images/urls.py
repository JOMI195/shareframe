from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import SentImagesViewSet


router = DefaultRouter()
router.register(r"sent-images", SentImagesViewSet, basename="sent_images")

urlpatterns = [
    path("", include(router.urls)),
]
