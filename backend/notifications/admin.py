from django.contrib import admin

from .models import ChannelSetting, Notification, PushSubscription


class ReadOnlyAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(ChannelSetting)
class ChannelSettingAdmin(admin.ModelAdmin):
    list_display = ("kind", "channel", "enabled")
    list_editable = ("enabled",)
    list_filter = ("kind", "channel", "enabled")
    readonly_fields = ("kind", "channel")

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(PushSubscription)
class PushSubscriptionAdmin(ReadOnlyAdmin):
    list_display = ("account", "endpoint", "created_at")
    search_fields = ("account__user__email", "account__user__username")


@admin.register(Notification)
class NotificationAdmin(ReadOnlyAdmin):
    list_display = ("account", "kind", "channel", "sent_at")
    list_filter = ("kind", "channel", "sent_at")
    search_fields = ("account__user__email", "account__user__username")
