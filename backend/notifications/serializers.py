from rest_framework import serializers

from .models import PushSubscription
from .push_endpoints import is_push_service_url


class PushSubscriptionSerializer(serializers.ModelSerializer):
    endpoint = serializers.URLField(max_length=1000)

    class Meta:
        model = PushSubscription
        fields = ["endpoint", "p256dh", "auth"]

    def validate_endpoint(self, value):
        if not is_push_service_url(value):
            raise serializers.ValidationError("Not a known push service.")
        return value


class PushEndpointSerializer(serializers.Serializer):
    endpoint = serializers.URLField(max_length=1000)


class UnsubscribeSerializer(serializers.Serializer):
    token = serializers.CharField()
