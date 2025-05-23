from django.contrib import admin
from django.utils.html import format_html
from .models import Frame, FrameToken, FrameWebsocketConnection


class FrameTokenInline(admin.TabularInline):
    fields = ("access_token", "access_token_expires_at", "last_obtained")
    model = FrameToken
    extra = 0
    readonly_fields = ("access_token", "access_token_expires_at", "last_obtained")
    can_delete = False


class FrameWebsocketConnectionInline(admin.TabularInline):
    fields = ("connected_at", "last_active")
    model = FrameWebsocketConnection
    extra = 0
    readonly_fields = ("connected_at", "last_active")
    can_delete = False


@admin.register(Frame)
class FrameAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "public_serial_number",
        "user",
        "version",
        "is_active",
        "has_ws_connection",
    )
    list_filter = ("is_active", "version")
    search_fields = ("public_serial_number", "user__username")
    list_per_page = 50

    inlines = [FrameTokenInline, FrameWebsocketConnectionInline]
    readonly_fields = (
        "registered_at",
        "last_connected",
        "last_active",
        "version",
        "local_ip_address",
        "last_board_heartbeat",
    )
    fieldsets = (
        (
            None,
            {
                "fields": ("user", "is_active", "version"),
            },
        ),
        (
            "Serial numbers",
            {
                "fields": ("public_serial_number", "private_serial_number"),
            },
        ),
        (
            "Timestamps",
            {
                "fields": ("registered_at", "last_connected", "last_active"),
            },
        ),
        (
            "Connection",
            {
                "fields": ("local_ip_address", "last_board_heartbeat"),
            },
        ),
    )

    def has_ws_connection(self, obj):
        has_connection = FrameWebsocketConnection.objects.filter(frame=obj).exists()
        return format_html(
            '<span style="color: {};">{}</span>',
            "green" if has_connection else "red",
            "✓" if has_connection else "✗",
        )

    has_ws_connection.short_description = "has_ws_connection"


@admin.register(FrameToken)
class FrameTokenAdmin(admin.ModelAdmin):
    list_display = ("id", "frame")
    list_filter = ("access_token_expires_at", "last_obtained")
    readonly_fields = ("last_obtained",)


@admin.register(FrameWebsocketConnection)
class FrameWebsocketConnectionAdmin(admin.ModelAdmin):
    list_display = ("id", "frame", "connected_at", "last_active")
    list_filter = ("connected_at", "last_active")
    list_per_page = 50
    ordering = ("-connected_at",)

    readonly_fields = (
        "frame",
        "connected_at",
        "last_active",
    )

    fieldsets = (
        (
            None,
            {"fields": ("frame",)},
        ),
        (
            "Timestamps",
            {
                "fields": (
                    "connected_at",
                    "last_active",
                ),
            },
        ),
    )
