from django.contrib import admin
from .models import Frame, FrameWebsocketConnection


@admin.register(Frame)
class FrameAdmin(admin.ModelAdmin):
    list_display = ("id", "serial_number", "is_active", "registered_at")
    list_filter = ("is_active", "registered_at")
    list_per_page = 50
    ordering = ("-registered_at",)

    readonly_fields = ("registered_at", "serial_number")

    fieldsets = (
        (
            None,
            {"fields": ("serial_number", "is_active", "registered_at")},
        ),
    )


@admin.register(FrameWebsocketConnection)
class FrameWebsocketConnectionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "frame", "connected_at", "last_active")
    list_filter = ("connected_at", "last_active")
    list_per_page = 50
    ordering = ("-connected_at",)

    readonly_fields = ("user", "frame", "channel_name", "connected_at", "last_active")

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "user",
                    "frame",
                    "channel_name",
                    "connected_at",
                    "last_active",
                )
            },
        ),
    )
