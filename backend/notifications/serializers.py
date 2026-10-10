from rest_framework import serializers

from .models import PushSubscription


class PushSubscriptionSerializer(serializers.ModelSerializer):
    endpoint = serializers.URLField(max_length=1000)

    class Meta:
        model = PushSubscription
        fields = ["endpoint", "p256dh", "auth"]


class PushEndpointSerializer(serializers.Serializer):
    endpoint = serializers.URLField(max_length=1000)


class UnsubscribeSerializer(serializers.Serializer):
    token = serializers.CharField()
