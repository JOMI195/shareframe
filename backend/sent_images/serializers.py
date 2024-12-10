from rest_framework import serializers

from images.serializers import ImageRetrieveSerializer
from .models import SentImage


class SentImagesRetrieveSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()
    reciever = serializers.SerializerMethodField()
    image = ImageRetrieveSerializer()

    def get_sender(self, obj):
        sender = obj.sender.username
        return sender

    def get_reciever(self, obj):
        reciever = obj.reciever.username
        return reciever

    class Meta:
        model = SentImage
        fields = ["id", "sender", "reciever", "image", "sent_at"]
