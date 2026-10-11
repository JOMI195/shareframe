from rest_framework import serializers

from images.serializers import ImageRetrieveSerializer
from user_accounts.avatars import avatar_url

from .models import SentImage


class SentImagesRetrieveSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()
    reciever = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()
    reciever_avatar = serializers.SerializerMethodField()
    image = ImageRetrieveSerializer()

    def get_sender(self, obj):
        sender = obj.sender.username
        return sender

    def get_reciever(self, obj):
        reciever = obj.reciever.username
        return reciever

    def get_sender_avatar(self, obj):
        return avatar_url(obj.sender)

    def get_reciever_avatar(self, obj):
        return avatar_url(obj.reciever)

    class Meta:
        model = SentImage
        fields = [
            "id",
            "sender",
            "reciever",
            "sender_avatar",
            "reciever_avatar",
            "image",
            "status",
            "scheduled_for",
            "sent_at",
            "expires_at",
        ]
