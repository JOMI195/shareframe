import base64
import os

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from django.conf import settings
from django.contrib import admin, messages
from django.contrib.admin import helpers
from django.core.exceptions import PermissionDenied
from django.http import FileResponse, HttpResponse
from django.shortcuts import get_object_or_404
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.utils.html import format_html
from inline_actions.admin import InlineActionsModelAdminMixin

from frame_updates.views import ordered_releases_for
from utils.admin import RowAction, confirm_page

from .commands import SERVICES, TIERS, FrameOffline, required_permission, send_command
from .keys import public_key_fingerprint
from .models import (
    Frame,
    FrameCommand,
    FrameDiagnostics,
    FrameGroup,
    FrameToken,
    FrameWebsocketConnection,
)


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


class FrameCommandInline(admin.TabularInline):
    model = FrameCommand
    fields = (
        "id",
        "command",
        "arg",
        "status",
        "reason",
        "requested_by",
        "created_at",
        "updated_at",
    )
    readonly_fields = fields
    extra = 0
    max_num = 0
    can_delete = False
    show_change_link = True
    verbose_name_plural = "Remote commands"


def diagnostics_download_link(diagnostics):
    url = reverse("admin:frames_framediagnostics_download", args=[diagnostics.pk])
    return format_html(
        '<a href="{}">Download ({} KB)</a>', url, round(diagnostics.size / 1024, 1)
    )


class FrameDiagnosticsInline(admin.TabularInline):
    model = FrameDiagnostics
    fields = ("created_at", "trigger", "command", "download")
    readonly_fields = fields
    extra = 0
    max_num = 0
    can_delete = False
    verbose_name_plural = "Diagnostics"

    def download(self, obj):
        if obj.pk is None:
            return "-"
        return diagnostics_download_link(obj)


COMMAND_WARNINGS = {
    "request_diagnostics": "The frame collects logs and system state and uploads them.",
    "restart_service": "Restarts one app service. Prefer this over a reboot.",
    "reboot": "Reboots the frame. Prefer restarting a single service when that is enough.",
    "update_install": "Installs the newest release regardless of criticality and reboots into it.",
    "factory_reset": "Wipes all images, WiFi networks, the device password and settings. Cannot be undone.",
}


def frame_command_action(command, label):
    def send(modeladmin, request, queryset):
        if queryset.count() != 1:
            modeladmin.message_user(
                request, "Send remote commands to one frame at a time.", messages.ERROR
            )
            return None
        if not request.user.has_perm(required_permission(command)):
            raise PermissionDenied
        frame = queryset.get()
        risky = TIERS[command] == "risky"

        if "apply" not in request.POST:
            releases = (
                ordered_releases_for(frame) if command == "update_install" else []
            )
            return TemplateResponse(
                request,
                "admin/frames/confirm_frame_command.html",
                {
                    **modeladmin.admin_site.each_context(request),
                    "title": label,
                    "opts": modeladmin.model._meta,
                    "frame": frame,
                    "command": command,
                    "tier": TIERS[command],
                    "warning": COMMAND_WARNINGS[command],
                    "release": releases[0] if releases else None,
                    "services": SERVICES if command == "restart_service" else None,
                    "confirm_serial": risky,
                    "action": send.__name__,
                    "action_checkbox_name": helpers.ACTION_CHECKBOX_NAME,
                },
            )

        if (
            risky
            and request.POST.get("confirm_serial", "").strip()
            != frame.public_serial_number
        ):
            modeladmin.message_user(
                request, "Serial did not match; nothing was sent.", messages.ERROR
            )
            return None
        try:
            cmd = send_command(
                frame, command, request.user, request.POST.get("arg", "")
            )
        except FrameOffline:
            modeladmin.message_user(
                request,
                f"Frame {frame} has no open websocket; nothing was sent.",
                messages.ERROR,
            )
        except ValueError as e:
            modeladmin.message_user(request, str(e), messages.ERROR)
        else:
            modeladmin.message_user(
                request,
                f"Command #{cmd.pk} sent to {frame}. The result shows under Remote commands on the frame page.",
            )
        return None

    send.__name__ = f"send_{command}"
    permission = (
        "send_risky_frame_command"
        if TIERS[command] == "risky"
        else "send_frame_command"
    )
    return admin.action(description=label, permissions=[permission])(send)


send_request_diagnostics = frame_command_action(
    "request_diagnostics", "Request diagnostics"
)
send_restart_service = frame_command_action("restart_service", "Restart service")
send_reboot = frame_command_action("reboot", "Reboot")
send_update_install = frame_command_action("update_install", "Install update (risky)")
send_factory_reset = frame_command_action("factory_reset", "Factory reset (risky)")


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
    if "apply" not in request.POST:
        return confirm_page(
            modeladmin,
            request,
            queryset,
            "generate_keypair",
            "Generate keypair",
            "These frames get a new keypair. The current key stops working until "
            "the frame is set up with the new private key.",
        )

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
class FrameAdmin(InlineActionsModelAdminMixin, admin.ModelAdmin):
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
    actions = [
        generate_otp,
        generate_keypair,
        send_request_diagnostics,
        send_restart_service,
        send_reboot,
        send_update_install,
        send_factory_reset,
    ]
    otp = RowAction(generate_otp, "OTP")
    keypair = RowAction(generate_keypair, "Keypair")
    diagnostics = RowAction(send_request_diagnostics, "Diagnostics")
    restart_service = RowAction(send_restart_service, "Restart service")
    reboot = RowAction(send_reboot, "Reboot")
    update_install = RowAction(send_update_install, "Update")
    factory_reset = RowAction(send_factory_reset, "Factory reset")
    inline_actions = [
        "otp",
        "keypair",
        "diagnostics",
        "restart_service",
        "reboot",
        "update_install",
        "factory_reset",
    ]

    inlines = [
        FrameTokenInline,
        FrameWebsocketConnectionInline,
        FrameCommandInline,
        FrameDiagnosticsInline,
    ]
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

    def has_send_frame_command_permission(self, request):
        return request.user.has_perm("frames.send_frame_command")

    def has_send_risky_frame_command_permission(self, request):
        return request.user.has_perm("frames.send_risky_frame_command")

    def group_list(self, obj):
        groups = obj.groups.all()
        if not groups:
            return format_html('<span style="color: red;">{}</span>', "No groups")

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


@admin.register(FrameCommand)
class FrameCommandAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "frame",
        "command",
        "arg",
        "tier",
        "status",
        "requested_by",
        "created_at",
    )
    list_filter = ("status", "command", "tier")
    search_fields = ("frame__public_serial_number",)
    list_per_page = 50

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(FrameDiagnostics)
class FrameDiagnosticsAdmin(admin.ModelAdmin):
    list_display = ("id", "frame", "trigger", "command", "created_at", "download")
    list_filter = ("trigger",)
    search_fields = ("frame__public_serial_number",)
    readonly_fields = ("frame", "command", "trigger", "size", "created_at", "download")
    fields = readonly_fields
    list_per_page = 50

    def has_add_permission(self, request):
        return False

    def download(self, obj):
        return diagnostics_download_link(obj)

    def get_urls(self):
        return [
            path(
                "<int:pk>/download/",
                self.admin_site.admin_view(self.download_view),
                name="frames_framediagnostics_download",
            ),
            *super().get_urls(),
        ]

    def download_view(self, request, pk):
        if not request.user.has_perm("frames.view_framediagnostics"):
            raise PermissionDenied
        diagnostics = get_object_or_404(FrameDiagnostics, pk=pk)
        filename = (
            f"diagnostics-{diagnostics.frame.public_serial_number}-"
            f"{diagnostics.created_at:%Y%m%d-%H%M%S}.gz"
        )
        if settings.DEBUG:
            return FileResponse(
                diagnostics.file.open("rb"), as_attachment=True, filename=filename
            )

        # nginx serves the file from its internal location (protected media).
        response = HttpResponse(content_type="application/gzip")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        response["X-Accel-Redirect"] = "/api/media/protected/" + diagnostics.file.name
        return response
