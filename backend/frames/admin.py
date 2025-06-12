from django.contrib import admin
from django.utils.html import format_html
from .models import Frame, FrameGroup, FrameToken, FrameWebsocketConnection


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


@admin.register(FrameGroup)
class FrameGroupAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "description", "frame_count", "created_at")
    search_fields = ("name", "description")
    readonly_fields = ("created_at",)
    list_per_page = 50

    def frame_count(self, obj):
        count = obj.frames.count()
        return format_html('<span style="font-weight: bold;">{}</span>', count)

    frame_count.short_description = "Frames"


@admin.register(Frame)
class FrameAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "public_serial_number",
        "user",
        "version",
        "is_active",
        "group_list",
        "has_ws_connection",
    )
    list_filter = ("is_active", "version")
    search_fields = ("public_serial_number", "user__username")
    list_per_page = 50
    filter_horizontal = ("groups",)

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
            "Groups",
            {
                "fields": ("groups",),
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

    def group_list(self, obj):
        groups = obj.groups.all()
        if not groups:
            return format_html('<span style="color: red;">No groups</span>')

        group_names = [group.name for group in groups]
        return format_html(
            '<span style="font-size: 12px;">{}</span>', ", ".join(group_names)
        )

    group_list.short_description = "Groups"


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
