from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DashboardAPIViewSet

router = DefaultRouter()
router.register(r"dashboard", DashboardAPIViewSet, basename="dashboard")

urlpatterns = [
    path("", include(router.urls)),
]
