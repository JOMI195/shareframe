from django.conf import settings
from django.core import signing
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from config.throttles import (
    OneClickUnsubscribeBurstRateThrottle,
    OneClickUnsubscribeSustainedRateThrottle,
    UnsubscribeBurstRateThrottle,
    UnsubscribeSustainedRateThrottle,
)
from user_accounts.models import Account, NotificationPreference

from .models import PushSubscription
from .serializers import (
    PushEndpointSerializer,
    PushSubscriptionSerializer,
    UnsubscribeSerializer,
)
from .unsubscribe import read_token


class PushKeyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"public_key": settings.VAPID_PUBLIC_KEY})


class PushSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PushSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        # A browser keeps its endpoint across logins, so it moves to the new account.
        PushSubscription.objects.update_or_create(
            endpoint=data["endpoint"],
            defaults={
                "account": request.user.account,
                "p256dh": data["p256dh"],
                "auth": data["auth"],
            },
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request):
        serializer = PushEndpointSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        PushSubscription.objects.filter(
            account=request.user.account,
            endpoint=serializer.validated_data["endpoint"],
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


def _opt_out(token):
    """Switch off what the token names; returns whether the token was valid."""
    try:
        account_id, kind, channel = read_token(token)
    except signing.BadSignature:
        return False

    account = Account.objects.filter(pk=account_id).first()
    if account is None:
        return False

    NotificationPreference.objects.update_or_create(
        account=account, kind=kind, channel=channel, defaults={"enabled": False}
    )
    return True


def _opt_out_response(token):
    if _opt_out(token):
        return Response(status=status.HTTP_204_NO_CONTENT)
    return Response(status=status.HTTP_400_BAD_REQUEST)


class UnsubscribeView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [UnsubscribeBurstRateThrottle, UnsubscribeSustainedRateThrottle]

    def post(self, request):
        serializer = UnsubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return _opt_out_response(serializer.validated_data["token"])


class OneClickUnsubscribeView(APIView):
    """RFC 8058 target for the List-Unsubscribe header; only POST opts out, so link scanners cannot."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [
        OneClickUnsubscribeBurstRateThrottle,
        OneClickUnsubscribeSustainedRateThrottle,
    ]

    def post(self, request):
        return _opt_out_response(request.query_params.get("token", ""))
