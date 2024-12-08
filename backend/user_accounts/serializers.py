from rest_framework import serializers
from .models import Account


class AccountRetrieveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ["friendship_user_searchable"]


class AccountUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ["friendship_user_searchable"]
