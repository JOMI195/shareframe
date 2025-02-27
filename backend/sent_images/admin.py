from django.contrib import admin
from .models import SentImage


@admin.register(SentImage)
class SentImageAdmin(admin.ModelAdmin):
    list_display = ("id", "sender", "reciever", "sent_at")
    list_filter = ("sent_at",)
    search_fields = ("sender__username", "reciever__username")
    ordering = ("-sent_at",)
    readonly_fields = (
        "sender",
        "reciever",
        "image",
        "sent_at",
        "expires_at",
    )

    fieldsets = (
        (
            None,
            {
                "fields": ("sender", "reciever", "image"),
            },
        ),
        (
            "Timestamps",
            {
                "fields": ("sent_at", "expires_at"),
            },
        ),
    )
