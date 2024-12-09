from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.utils import timezone
from frames.models import FrameToken


class FrameAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):

        headers = dict(scope.get("headers", []))

        auth_header = headers.get(b"authorization", b"")

        if auth_header:
            auth_header = auth_header.decode("utf-8")

            if auth_header.startswith("Frame-access-token "):
                access_token = auth_header.split(" ")[1]

                frame = await self.get_frame_from_token(access_token)

                if frame:
                    scope = {
                        **scope,
                        "frame": frame,
                    }

        return await self.inner(scope, receive, send)

    @database_sync_to_async
    def get_frame_from_token(self, access_token):
        try:
            frame_token = FrameToken.objects.select_related("frame").get(
                access_token=access_token,
                frame__is_active=True,
                access_token_expires_at__gt=timezone.now(),
            )
            frame = frame_token.frame
            if frame.user:
                return frame
            return None
        except FrameToken.DoesNotExist:
            return None


def FrameTokenAuthMiddlewareStack(inner):
    return FrameAuthMiddleware(inner)
