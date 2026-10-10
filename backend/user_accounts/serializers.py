from rest_framework import serializers

from notifications.choices import NotificationChannel, NotificationKind
from notifications.models import ChannelSetting

from .models import Account, NotificationKindPreference, NotificationPreference


class ChannelPreferenceSerializer(serializers.Serializer):
    channel = serializers.ChoiceField(choices=NotificationChannel.choices)
    enabled = serializers.BooleanField()


class KindPreferenceSerializer(serializers.Serializer):
    kind = serializers.ChoiceField(choices=NotificationKind.choices)
    enabled = serializers.BooleanField(required=False)
    channels = ChannelPreferenceSerializer(many=True, required=False)


class NotificationPreferencesField(serializers.Field):
    """Per kind the general toggle and its channels, limited to what the admin enabled."""

    def __init__(self, **kwargs):
        kwargs["source"] = "*"
        super().__init__(**kwargs)

    def to_representation(self, account):
        enabled_pairs = ChannelSetting.enabled_pairs()
        kinds = {p.kind: p.enabled for p in account.notification_kind_preferences.all()}
        channels = {
            (p.kind, p.channel): p.enabled
            for p in account.notification_preferences.all()
        }
        result = []
        for kind in NotificationKind.values:
            available = [
                channel
                for channel in NotificationChannel.values
                if (kind, channel) in enabled_pairs
            ]
            if not available:
                continue
            result.append(
                {
                    "kind": kind,
                    "enabled": kinds.get(kind, False),
                    "channels": [
                        {
                            "channel": channel,
                            "enabled": channels.get((kind, channel), False),
                        }
                        for channel in available
                    ],
                }
            )
        return result

    def to_internal_value(self, data):
        serializer = KindPreferenceSerializer(data=data, many=True)
        serializer.is_valid(raise_exception=True)
        enabled_pairs = ChannelSetting.enabled_pairs()
        enabled_kinds = {kind for kind, _ in enabled_pairs}
        for item in serializer.validated_data:
            if item["kind"] not in enabled_kinds:
                raise serializers.ValidationError(f"{item['kind']} is not available.")
            for channel in item.get("channels", []):
                if (item["kind"], channel["channel"]) not in enabled_pairs:
                    raise serializers.ValidationError(
                        f"{item['kind']} via {channel['channel']} is not available."
                    )
        return {"notification_preferences": serializer.validated_data}


class AccountRetrieveSerializer(serializers.ModelSerializer):
    notification_preferences = NotificationPreferencesField(read_only=True)

    class Meta:
        model = Account
        fields = [
            "friendship_user_searchable",
            "friendship_user_search_code",
            "notification_preferences",
        ]


class AccountUpdateSerializer(serializers.ModelSerializer):
    notification_preferences = NotificationPreferencesField(required=False)

    class Meta:
        model = Account
        fields = [
            "friendship_user_searchable",
            "friendship_user_search_code",
            "notification_preferences",
        ]
        read_only_fields = ("friendship_user_search_code",)

    def update(self, instance, validated_data):
        for item in validated_data.pop("notification_preferences", []):
            if "enabled" in item:
                NotificationKindPreference.objects.update_or_create(
                    account=instance,
                    kind=item["kind"],
                    defaults={"enabled": item["enabled"]},
                )
            for channel in item.get("channels", []):
                NotificationPreference.objects.update_or_create(
                    account=instance,
                    kind=item["kind"],
                    channel=channel["channel"],
                    defaults={"enabled": channel["enabled"]},
                )
        return super().update(instance, validated_data)
