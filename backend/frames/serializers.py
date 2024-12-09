from rest_framework import serializers
from .models import Frame, FrameToken


class FrameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Frame
        fields = [
            "id",
            "user",
            "public_serial_number",
            "private_serial_number",
            "is_active",
            "registered_at",
            "last_connected",
        ]
        read_only_fields = ["registered_at"]


class FrameTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = FrameToken
        fields = ["access_token", "access_token_expires_at"]
