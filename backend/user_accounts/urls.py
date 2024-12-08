from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import AccountsViewSet


router = DefaultRouter()
router.register(r"accounts", AccountsViewSet, basename="accounts")

urlpatterns = [
    path("", include(router.urls)),
]
