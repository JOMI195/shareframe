from django.conf import settings
from django.contrib.auth.signals import user_logged_in, user_login_failed
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .auth import enforce_csrf
from .cookies import delete_auth_cookies, set_auth_cookies


class SignalTokenObtainPairView(TokenObtainPairView):
    """TokenObtainPairView that fires Django login signals."""

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except (InvalidToken, TokenError):
            user_login_failed.send(
                sender=self.__class__,
                credentials={"email": request.data.get("email", "")},
                request=request,
            )
            raise

        user_logged_in.send(
            sender=self.__class__,
            request=request,
            user=serializer.user,
        )
        return Response(serializer.validated_data)


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
            return Response(
                {"detail": "Refresh cookie missing."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # request.data may be an immutable QueryDict.
        serializer = self.get_serializer(data={"refresh": refresh})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])

        tokens = serializer.validated_data
        response = Response({"detail": "Refreshed."})
        return set_auth_cookies(response, tokens.get("access"), tokens.get("refresh"))


class LogoutView(APIView):
    """Auth-less: an expired access token must not block logout."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        enforce_csrf(request)

        refresh = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH_NAME)
        if refresh:
            try:
                RefreshToken(refresh).blacklist()
            except TokenError:
                pass

        response = Response(status=status.HTTP_204_NO_CONTENT)
        return delete_auth_cookies(response)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CSRFView(APIView):
    """Lets the SPA get a csrftoken before its first unsafe request."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, *args, **kwargs):
        return Response(status=status.HTTP_204_NO_CONTENT)
