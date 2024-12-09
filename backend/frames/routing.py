from django.urls import path
from .consumers import FrameWebSocketConsumer

websocket_urlpatterns = [
    path("ws/frames/", FrameWebSocketConsumer.as_asgi()),
]
