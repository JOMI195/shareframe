from user_accounts.serializers import AccountRetrieveSerializer
from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer
from djoser.serializers import UserSerializer as BaseUserSerializer

from .models import User


class UserRetrieveSerializer(BaseUserSerializer):
    account = AccountRetrieveSerializer()

    class Meta(BaseUserSerializer.Meta):
        model = User
        fields = ("id", "email", "username", "account")


class UserCreateSerializer(BaseUserCreateSerializer):
    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            password=validated_data["password"],
        )
        return user


class UserRetrievePatchSerializer(BaseUserSerializer):
    account = AccountRetrieveSerializer()

    class Meta(BaseUserSerializer.Meta):
        model = User
        fields = ("id", "email", "username", "account")
        read_only_fields = ("id", "email")

    def update(self, instance, validated_data):
        account_data = validated_data.pop("account", None)

        user = super().update(instance, validated_data)

        if account_data:
            account_serializer = AccountRetrieveSerializer(
                instance=user.account, data=account_data, partial=True
            )
            account_serializer.is_valid(raise_exception=True)
            account_serializer.save()

        return user
