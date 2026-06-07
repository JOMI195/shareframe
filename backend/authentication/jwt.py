from django.contrib.auth.signals import user_logged_in, user_login_failed
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.views import TokenObtainPairView


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
