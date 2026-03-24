from rest_framework import serializers
from .models import Frame, FrameWebsocketConnection


class FrameWebsocketConnectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FrameWebsocketConnection
        fields = ["connected_at", "last_active"]


class FrameRetrieveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Frame
        fields = [
            "id",
            "public_serial_number",
            "is_active",
            "registered_at",
            "local_ip_address",
            "last_seen",
        ]
