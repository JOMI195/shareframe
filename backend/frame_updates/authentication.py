from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from frames.models import FrameToken


class FrameTokenAuthentication(BaseAuthentication):

    def authenticate(self, request):
        token = request.headers.get("Authorization")

        if not token:
            return None

        try:
            prefix, access_token = token.split(" ")
            if prefix.lower() != "frame-access-token":
                raise AuthenticationFailed("Invalid token format")
        except ValueError:
            raise AuthenticationFailed("Invalid token format")

        try:
            frame_token = FrameToken.objects.select_related("frame").get(
                access_token=access_token
            )

            if not frame_token.is_access_token_valid():
                raise AuthenticationFailed("Token has expired")

            return (frame_token.frame.user, frame_token)

        except FrameToken.DoesNotExist:
            raise AuthenticationFailed("Invalid token")

        return None
