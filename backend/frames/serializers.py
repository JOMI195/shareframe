from rest_framework import serializers
from .models import Frame, FrameWebsocketConnection


class FrameWebsocketConnectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FrameWebsocketConnection
        fields = ["local_ip_address", "connected_at", "last_active"]


class FrameRetrieveSerializer(serializers.ModelSerializer):
    frame_websocket_connections = FrameWebsocketConnectionSerializer(read_only=True)

    class Meta:
        model = Frame
        fields = [
            "id",
            "public_serial_number",
            "is_active",
            "registered_at",
            "frame_websocket_connections",
        ]
