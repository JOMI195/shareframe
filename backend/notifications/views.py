from django.conf import settings
from django.core import signing
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from config.throttles import (
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

    @extend_schema(request=PushSubscriptionSerializer, responses={204: None})
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

    @extend_schema(request=PushEndpointSerializer, responses={204: None})
    def delete(self, request):
        serializer = PushEndpointSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        PushSubscription.objects.filter(
            account=request.user.account,
            endpoint=serializer.validated_data["endpoint"],
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UnsubscribeView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [UnsubscribeBurstRateThrottle, UnsubscribeSustainedRateThrottle]

    @extend_schema(request=UnsubscribeSerializer, responses={204: None})
    def post(self, request):
        serializer = UnsubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            account_id, kind, channel = read_token(serializer.validated_data["token"])
        except signing.BadSignature:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        account = Account.objects.filter(pk=account_id).first()
        if account is None:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        NotificationPreference.objects.update_or_create(
            account=account, kind=kind, channel=channel, defaults={"enabled": False}
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
