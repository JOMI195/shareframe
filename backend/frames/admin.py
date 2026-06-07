import os
import base64
from django.contrib import admin
from django.contrib import messages
from django.utils.html import format_html
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from .keys import public_key_fingerprint
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


@admin.action(description="Generate OTP code (shows code once)")
def generate_otp(modeladmin, request, queryset):
    expiry_minutes = int(os.environ.get("DJANGO_FRAME_OTP_EXPIRY_MINUTES", 10))
    for frame in queryset:
        code = frame.generate_otp(expiry_minutes=expiry_minutes)
        modeladmin.message_user(
            request,
            f"Frame {frame.public_serial_number} — OTP: {code} (expires in {expiry_minutes} min)",
        )


@admin.action(description="Generate ed25519 keypair (shows private key once)")
def generate_keypair(modeladmin, request, queryset):
    for frame in queryset:
        private_key = Ed25519PrivateKey.generate()
        public_bytes = private_key.public_key().public_bytes_raw()
        private_seed = private_key.private_bytes_raw()

        public_key_b64 = base64.b64encode(public_bytes).decode()
        frame.public_key = public_key_b64
        frame.public_serial_number = public_key_fingerprint(public_key_b64)
        frame.save(update_fields=["public_key", "public_serial_number"])

        modeladmin.message_user(
            request,
            f"Frame id {frame.public_serial_number} — private key seed "
            f"(copy now, shown once): {base64.b64encode(private_seed).decode()}",
            level=messages.WARNING,
        )


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
    actions = [generate_otp, generate_keypair]

    inlines = [FrameTokenInline, FrameWebsocketConnectionInline]
    readonly_fields = (
        "public_key",
        "registered_at",
        "last_connected",
        "last_seen",
        "version",
        "local_ip_address",
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
            "Authentication",
            {
                "fields": (
                    "public_serial_number",
                    "private_serial_number",
                    "public_key",
                ),
            },
        ),
        (
            "Timestamps",
            {
                "fields": ("registered_at", "last_connected", "last_seen"),
            },
        ),
        (
            "Connection",
            {
                "fields": ("local_ip_address",),
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
