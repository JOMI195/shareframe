from django.contrib.auth import get_user_model
from djoser.views import UserViewSet as BaseUserViewSet
from rest_framework import serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response

from appEmail.djoserEmailConfig import DjoserUserDeletedEmail
from authentication.cookies import delete_auth_cookies
from config.throttles import (
    AuthEmailBurstRateThrottle,
    AuthEmailSustainedRateThrottle,
)

# Anonymous actions that mail an arbitrary address or check an emailed token.
AUTH_EMAIL_ACTIONS = (
    "activation",
    "resend_activation",
    "reset_password",
    "reset_password_confirm",
    "reset_username",
    "reset_username_confirm",
)


class PasswordSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)


class CustomUserViewSet(BaseUserViewSet):
    @action(methods=["get", "patch", "put", "delete"], detail=False)
    def me(self, request, *args, **kwargs):
        if request.method == "DELETE":
            serializer = PasswordSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            password = serializer.validated_data["password"]

            if not request.user.check_password(password):
                return Response(
                    {"detail": "Incorrect password."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Loaded before delete() for the farewell mail.
            user = get_user_model().objects.get(pk=request.user.pk)

            request.user.delete()

            DjoserUserDeletedEmail(self.request, {"user": user}).send([user.email])

            return delete_auth_cookies(Response(status=status.HTTP_204_NO_CONTENT))

        return super().me(request, *args, **kwargs)

    def get_throttles(self):
        if self.action in AUTH_EMAIL_ACTIONS:
            return [AuthEmailBurstRateThrottle(), AuthEmailSustainedRateThrottle()]
        return super().get_throttles()

    def create(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def destroy(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)
