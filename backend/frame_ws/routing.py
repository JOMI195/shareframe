from django.urls import path
from .consumers import FrameWebSocketConsumer

websocket_urlpatterns = [
    path("ws/frame/<str:serial_number>/", FrameWebSocketConsumer.as_asgi()),
]
