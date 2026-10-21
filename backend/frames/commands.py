import json
import logging
from datetime import timedelta

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone

from .models import FrameCommand, FrameWebsocketConnection

logger = logging.getLogger("admin.audit")

COMMAND_TTL = timedelta(minutes=10)

# Tiers decide admin permission and confirmation; the frame keeps its own allowlist.
TIERS = {
    "request_diagnostics": "read",
    "restart_service": "safe",
    "reboot": "safe",
    "update_install": "risky",
    "factory_reset": "risky",
    "shutdown": "risky",
}
SERVICES = ("display", "websocket", "dashboard", "heartbeat", "update")
RESULT_STATUSES = {
    FrameCommand.Status.ACCEPTED,
    FrameCommand.Status.REJECTED,
    FrameCommand.Status.DONE,
    FrameCommand.Status.FAILED,
}


class FrameOffline(Exception):
    pass


def required_permission(command):
    if TIERS[command] == "risky":
        return "frames.send_risky_frame_command"
    return "frames.send_frame_command"


def send_command(frame, command, user, arg=""):
    if command not in TIERS:
        raise ValueError(f"Unknown command {command!r}")
    if command == "restart_service" and arg not in SERVICES:
        raise ValueError(f"Unknown service {arg!r}")

    # Never queue: a reboot must not fire days later when the frame reconnects.
    connection = FrameWebsocketConnection.objects.filter(frame=frame).first()
    if connection is None:
        raise FrameOffline(frame.public_serial_number)

    cmd = FrameCommand.objects.create(
        frame=frame,
        command=command,
        arg=arg,
        tier=TIERS[command],
        requested_by=user,
        expires_at=timezone.now() + COMMAND_TTL,
    )
    message = {
        "type": "command",
        "id": cmd.pk,
        "command": command,
        "arg": arg,
        "expires_at": int(cmd.expires_at.timestamp()),
    }
    async_to_sync(get_channel_layer().send)(
        connection.channel_name, {"type": "send_command", "data": json.dumps(message)}
    )
    logger.info(
        f"Remote command #{cmd.pk} {command} {arg} sent to frame "
        f"{frame.public_serial_number} by {user}".replace("  ", " ")
    )
    return cmd


def record_result(frame, message):
    """Applies a frame's command_result; ignores ids of other frames and closed commands."""
    status = message.get("status")
    if status not in RESULT_STATUSES:
        return False
    updated = FrameCommand.objects.filter(
        pk=message.get("id"),
        frame=frame,
        status__in=(FrameCommand.Status.SENT, FrameCommand.Status.ACCEPTED),
    ).update(
        status=status,
        reason=str(message.get("reason") or "")[:2000],
        result=message.get("result"),
        updated_at=timezone.now(),
    )
    return bool(updated)


def expire_stale_commands():
    return FrameCommand.objects.filter(
        status=FrameCommand.Status.SENT, expires_at__lt=timezone.now()
    ).update(
        status=FrameCommand.Status.EXPIRED,
        reason="No response. The frame may run firmware without remote commands.",
        updated_at=timezone.now(),
    )
