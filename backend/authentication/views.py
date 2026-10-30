import logging

from django.contrib.auth import get_user_model
from django.core import signing
from django.db import IntegrityError, transaction
from djoser.utils import decode_uid
from djoser.views import UserViewSet as BaseUserViewSet
from rest_framework import serializers, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from appEmail.djoserEmailConfig import (
    DjoserEmailChangeConfirmEmail,
    DjoserEmailChangedEmail,
    DjoserUserDeletedEmail,
)
from authentication.cookies import delete_auth_cookies
from config import error_codes
from config.throttles import (
    AuthEmailBurstRateThrottle,
    AuthEmailSustainedRateThrottle,
)
from user_core import email_change
from user_core.serializers import (
    EmailChangeConfirmSerializer,
    EmailChangeRequestSerializer,
)
from utils.api_errors import error_response
from utils.client_ip import client_ip

logger = logging.getLogger("admin.audit")

# Actions that mail an arbitrary address or check an emailed token.
AUTH_EMAIL_ACTIONS = (
    "activation",
    "resend_activation",
    "reset_password",
    "reset_password_confirm",
    "request_email_change",
    "confirm_email_change",
)

INVALID_EMAIL_CHANGE_LINK = "Der Link ist ungültig oder abgelaufen."


def _password_error_code(fields):
    if "current_password" in fields:
        return error_codes.WRONG_PASSWORD
    if "uid" in fields or "token" in fields:
        return error_codes.RESET_LINK_INVALID
    if "new_password" in fields or "re_new_password" in fields:
        return error_codes.PASSWORD_INVALID
    if "non_field_errors" in fields:
        return error_codes.PASSWORD_MISMATCH
    return None


def _with_password_error_code(exc):
    fields = exc.detail if isinstance(exc.detail, dict) else {}
    code = _password_error_code(fields)
    if code is None:
        raise exc
    return Response({**fields, "code": code}, status=status.HTTP_400_BAD_REQUEST)


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
                return error_response(
                    error_codes.WRONG_PASSWORD,
                    "Incorrect password.",
                    status.HTTP_400_BAD_REQUEST,
                )

            # Loaded before delete() for the farewell mail.
            user = get_user_model().objects.get(pk=request.user.pk)

            request.user.delete()
            logger.info("Account deleted: %s from %s", user.email, client_ip(request))

            DjoserUserDeletedEmail(self.request, {"user": user}).send([user.email])

            return delete_auth_cookies(Response(status=status.HTTP_204_NO_CONTENT))

        return super().me(request, *args, **kwargs)

    @action(["post"], detail=False, serializer_class=EmailChangeRequestSerializer)
    def request_email_change(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_email = serializer.validated_data["new_email"]

        DjoserEmailChangeConfirmEmail(
            request,
            {
                "user": request.user,
                "new_email": new_email,
                "token": email_change.make_token(request.user, new_email),
            },
        ).send([new_email])
        logger.info(
            "Email change requested: %s to %s from %s",
            request.user.email,
            new_email,
            client_ip(request),
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        ["post"],
        detail=False,
        permission_classes=[AllowAny],
        serializer_class=EmailChangeConfirmSerializer,
    )
    def confirm_email_change(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user_id, new_email, fingerprint = email_change.read_token(
                serializer.validated_data["token"]
            )
        except signing.BadSignature:
            return self._email_change_rejected(INVALID_EMAIL_CHANGE_LINK, "bad link")

        User = get_user_model()
        user = User.objects.filter(pk=user_id).first()
        if user is None or not email_change.matches(user, fingerprint):
            return self._email_change_rejected(INVALID_EMAIL_CHANGE_LINK, "stale link")

        taken = "Diese E-Mail ist bereits vergeben."
        if User.objects.filter(email__iexact=new_email).exists():
            return self._email_change_rejected(taken, "address taken")

        old_email = user.email
        user.email = new_email
        try:
            with transaction.atomic():
                user.save(update_fields=["email"])
        except IntegrityError:
            return self._email_change_rejected(taken, "address taken")

        logger.info(
            "Email changed: %s to %s from %s", old_email, new_email, client_ip(request)
        )
        DjoserEmailChangedEmail(request, {"user": user}).send([old_email])

        return Response(status=status.HTTP_204_NO_CONTENT)

    def _email_change_rejected(self, message, reason):
        logger.warning(
            "Email change rejected (%s) from %s", reason, client_ip(self.request)
        )
        return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)

    @action(["post"], detail=False)
    def set_password(self, request, *args, **kwargs):
        try:
            response = super().set_password(request, *args, **kwargs)
        except ValidationError as exc:
            return _with_password_error_code(exc)
        logger.info(
            "Password changed: %s from %s", request.user.email, client_ip(request)
        )
        return response

    @action(["post"], detail=False)
    def reset_password_confirm(self, request, *args, **kwargs):
        try:
            response = super().reset_password_confirm(request, *args, **kwargs)
        except ValidationError as exc:
            return _with_password_error_code(exc)
        user = get_user_model().objects.get(pk=decode_uid(request.data["uid"]))
        logger.info("Password reset: %s from %s", user.email, client_ip(request))
        return response

    # Direct changes skip the confirmation mail to the new address.
    @action(["post"], detail=False, url_path="set_email")
    def set_username(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(["post"], detail=False, url_path="reset_email")
    def reset_username(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(["post"], detail=False, url_path="reset_email_confirm")
    def reset_username_confirm(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def get_throttles(self):
        if self.action in AUTH_EMAIL_ACTIONS:
            return [AuthEmailBurstRateThrottle(), AuthEmailSustainedRateThrottle()]
        return super().get_throttles()

    def create(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def destroy(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)
