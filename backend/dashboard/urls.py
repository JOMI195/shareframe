from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import DashboardAPIViewSet

router = SimpleRouter()
router.register(r"dashboard", DashboardAPIViewSet, basename="dashboard")

urlpatterns = [
    path("", include(router.urls)),
]
