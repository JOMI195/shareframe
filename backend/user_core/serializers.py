from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer
from djoser.serializers import UserSerializer as BaseUserSerializer

from .models import User


class UserRetrieveSerializer(BaseUserSerializer):
    class Meta(BaseUserSerializer.Meta):
        model = User
        fields = ("id", "email", "username")


class UserCreateSerializer(BaseUserCreateSerializer):
    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            password=validated_data["password"],
        )
        return user


class UserRetrievePatchSerializer(BaseUserSerializer):
    
    class Meta(BaseUserSerializer.Meta):
        model = User
        fields = ("id", "email", "username")
        read_only_fields = ("id", "email")
