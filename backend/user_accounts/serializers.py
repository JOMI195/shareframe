from rest_framework import serializers
from .models import Account


class AccountRetrieveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ["friendship_user_searchable", "friendship_user_search_code"]


class AccountUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ["friendship_user_searchable", "friendship_user_search_code"]
        read_only_fields = ("friendship_user_search_code",)
