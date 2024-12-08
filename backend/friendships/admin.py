from django.contrib import admin
from .models import Friendship


@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    list_display = ("id", "sender", "reciever", "status", "created_at", "updated_at")
    list_filter = ("status", "created_at")
    search_fields = ("sender__username", "reciever__username")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            None,
            {
                "fields": ("sender", "reciever", "status"),
            },
        ),
        (
            "Timestamps",
            {
                "fields": ("created_at", "updated_at"),
            },
        ),
    )
