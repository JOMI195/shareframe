from rest_framework import serializers
from .models import Frame


class FrameRetrieveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Frame
        fields = [
            "id",
            "public_serial_number",
            "is_active",
            "registered_at",
        ]
