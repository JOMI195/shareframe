from django.urls import include, path
from rest_framework import routers

from .views import UserRetrieveViewSet

router = routers.DefaultRouter()

router.register(r"", UserRetrieveViewSet, basename="user")

urlpatterns = [
    path("", include(router.urls)),
]
