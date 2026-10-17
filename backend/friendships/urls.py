from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import FriendshipViewSet

router = SimpleRouter()
router.register(r"friendships", FriendshipViewSet, basename="friendships")

urlpatterns = [
    path("", include(router.urls)),
]
