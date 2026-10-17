from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import SentImagesViewSet

router = SimpleRouter()
router.register(r"sent-images", SentImagesViewSet, basename="sent_images")

urlpatterns = [
    path("", include(router.urls)),
]
