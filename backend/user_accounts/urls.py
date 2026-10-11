from django.urls import path

from .views import AvatarView

urlpatterns = [
    path("accounts/me/avatar/", AvatarView.as_view(), name="my-avatar"),
]
