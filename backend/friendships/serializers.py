from rest_framework import serializers
from .models import Friendship


class FriendshipRetrieveSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()
    reciever = serializers.SerializerMethodField()

    def get_sender(self, obj):
        sender = {
            "id": obj.sender.id,
            "username": obj.sender.username,
        }
        return sender

    def get_reciever(self, obj):
        reciever = {
            "id": obj.reciever.id,
            "username": obj.reciever.username,
        }
        return reciever

    class Meta:
        model = Friendship
        fields = [
            "id",
            "sender",
            "reciever",
            "status",
            "created_at",
        ]


class FriendshipCreateSerializer(serializers.ModelSerializer):
    reciever_id = serializers.CharField()

    class Meta:
        model = Friendship
        fields = [
            "reciever_id",
        ]
        read_only_fields = ("created_at", "updated_at")

    def create(self, validated_data):
        validated_data.pop("reciever_id", None)

        validated_data["sender"] = self.context["sender"]
        validated_data["reciever"] = self.context["reciever"]

        return super().create(validated_data)


class FriendshipDestroySerializer(serializers.ModelSerializer):
    class Meta:
        model = Friendship
        fields = ()
