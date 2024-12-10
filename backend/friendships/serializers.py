from rest_framework import serializers
from .models import Friendship


class FriendshipRetrieveSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()
    reciever = serializers.SerializerMethodField()

    def get_sender(self, obj):
        sender = obj.sender.username
        return sender

    def get_reciever(self, obj):
        reciever = obj.reciever.username
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
    reciever_friendship_user_search_code = serializers.CharField()

    class Meta:
        model = Friendship
        fields = [
            "reciever_friendship_user_search_code",
        ]
        read_only_fields = ("created_at", "updated_at")

    def create(self, validated_data):
        validated_data.pop("reciever_friendship_user_search_code", None)

        validated_data["sender"] = self.context["sender"]
        validated_data["reciever"] = self.context["reciever"]

        return super().create(validated_data)


class FriendshipDestroySerializer(serializers.ModelSerializer):
    class Meta:
        model = Friendship
        fields = ()
