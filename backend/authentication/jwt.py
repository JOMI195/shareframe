import logging

from django.conf import settings
from django.contrib.auth.signals import user_logged_in, user_login_failed
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from config.throttles import (
    BurstRateThrottle,
    FailedLoginThrottle,
    SustainedRateThrottle,
)
from utils.client_ip import client_ip

from .auth import enforce_csrf
from .cookies import delete_auth_cookies, set_auth_cookies

logger = logging.getLogger("admin.audit")


def _token_user_id(raw):
    try:
        return RefreshToken(raw).get(api_settings.USER_ID_CLAIM)
    except TokenError:
        return None


class SignalTokenObtainPairView(TokenObtainPairView):
    """TokenObtainPairView that fires Django login signals."""

    throttle_classes = [BurstRateThrottle, SustainedRateThrottle, FailedLoginThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except (InvalidToken, TokenError):
            FailedLoginThrottle().record_failure(request, self)
            user_login_failed.send(
                sender=self.__class__,
                credentials={"email": request.data.get("email", "")},
                request=request,
            )
            raise
        except AuthenticationFailed:
            # authenticate() already sent user_login_failed for a bad password.
            FailedLoginThrottle().record_failure(request, self)
            raise

        user_logged_in.send(
            sender=self.__class__,
            request=request,
            user=serializer.user,
        )
        return Response(serializer.validated_data)

    def throttled(self, request, wait):
        logger.warning("Login throttled from %s", client_ip(request))
        super().throttled(request, wait)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CookieTokenObtainPairView(SignalTokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        tokens = response.data
        response.data = {"detail": "Authenticated."}
        return set_auth_cookies(response, tokens.get("access"), tokens.get("refresh"))


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CookieTokenRefreshView(TokenRefreshView):
    """No auth class here, so CSRF is enforced manually."""

    def post(self, request, *args, **kwargs):
        enforce_csrf(request)

        refresh = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH_NAME)
        if not refresh:
            logger.warning(
                "Token refresh rejected (missing) from %s", client_ip(request)
            )
            return Response(
                {"detail": "Refresh cookie missing."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # request.data may be an immutable QueryDict.
        serializer = self.get_serializer(data={"refresh": refresh})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            logger.warning(
                "Token refresh rejected (invalid) from %s", client_ip(request)
            )
            raise InvalidToken(e.args[0]) from e

        tokens = serializer.validated_data
        logger.info(
            "Token refreshed: user %s from %s",
            _token_user_id(tokens.get("refresh", refresh)),
            client_ip(request),
        )
        response = Response({"detail": "Refreshed."})
        return set_auth_cookies(response, tokens.get("access"), tokens.get("refresh"))


class LogoutView(APIView):
    """Auth-less: an expired access token must not block logout."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        enforce_csrf(request)

        refresh = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH_NAME)
        user_id = None
        if refresh:
            try:
                token = RefreshToken(refresh)
                user_id = token.get(api_settings.USER_ID_CLAIM)
                token.blacklist()
            except TokenError:
                pass
        logger.info("Logout: user %s from %s", user_id or "unknown", client_ip(request))

        response = Response(status=status.HTTP_204_NO_CONTENT)
        # Private photos must not stay in the HTTP cache of a shared device.
        response["Clear-Site-Data"] = '"cache"'
        return delete_auth_cookies(response)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CSRFView(APIView):
    """Lets the SPA get a csrftoken before its first unsafe request."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, *args, **kwargs):
        return Response(status=status.HTTP_204_NO_CONTENT)
