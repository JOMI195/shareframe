from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.tokens import AccessToken, TokenError
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
import json


class JWTAuthMiddleware(BaseMiddleware):

    async def __call__(self, scope, receive, send):
        token = self.get_token_from_scope(scope)
        if not token:
            await self.send_error_message(send, "Authentication token is required.")
            await self.close_connection(send)
            return None

        try:
            user = await self.get_user_from_token(token)
            if user:
                scope["user"] = user
            else:
                raise TokenError("Token Invalid or expired")
        except (TokenError, Exception) as e:
            await self.send_error_message(send, f"Authentication failed: {str(e)}")
            await self.close_connection(send)
            return None

        return await super().__call__(scope, receive, send)

    def get_token_from_scope(self, scope):
        headers = dict(scope.get("headers", []))
        auth_header = headers.get(b"authorization", b"").decode("utf-8")

        if auth_header.startswith("Bearer "):
            return auth_header.split(" ")[1]
        return None

    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            access_token = AccessToken(token)
            user_id = access_token["user_id"]
            return get_user_model().objects.get(id=user_id)
        except TokenError:
            raise TokenError()

    async def send_error_message(self, send, error_message):
        await send(text_data=json.dumps({"type": "error", "message": error_message}))

    async def close_connection(self, send):
        await send({"type": "close_connection"})
