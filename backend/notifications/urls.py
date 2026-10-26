from django.urls import path

from .views import (
    OneClickUnsubscribeView,
    PushKeyView,
    PushSubscriptionView,
    UnsubscribeView,
)

urlpatterns = [
    path("notifications/push/key/", PushKeyView.as_view(), name="push-key"),
    path(
        "notifications/push/subscriptions/",
        PushSubscriptionView.as_view(),
        name="push-subscriptions",
    ),
    path(
        "notifications/unsubscribe/",
        UnsubscribeView.as_view(),
        name="notifications-unsubscribe",
    ),
    path(
        "notifications/unsubscribe/one-click/",
        OneClickUnsubscribeView.as_view(),
        name="notifications-unsubscribe-one-click",
    ),
]
