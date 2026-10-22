import json
from datetime import timedelta

import pytest
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.core.files.base import ContentFile
from django.test import Client
from django.utils import timezone

from frames.commands import expire_stale_commands, record_result, send_command
from frames.models import FrameCommand, FrameDiagnostics, FrameWebsocketConnection
from tests.support.factories import FrameFactory, UserFactory

pytestmark = pytest.mark.django_db

URL = "/api/admin/frames/frame/"


@pytest.fixture
def admin_user():
    return UserFactory(is_active=True, is_staff=True, is_admin=True)


@pytest.fixture
def admin_client(admin_user):
    client = Client()
    client.force_login(admin_user)
    return client


def online(frame):
    layer = get_channel_layer()
    channel = async_to_sync(layer.new_channel)()
    FrameWebsocketConnection.objects.create(frame=frame, channel_name=channel)
    return lambda: async_to_sync(layer.receive)(channel)


def apply(client, action, frame, **extra):
    return client.post(
        URL,
        {"action": action, "_selected_action": frame.pk, "apply": "yes", **extra},
        follow=True,
    )


def test_a_command_reaches_the_frame_websocket(admin_user):
    frame = FrameFactory()
    receive = online(frame)

    cmd = send_command(frame, "restart_service", admin_user, "display")

    event = receive()
    assert event["type"] == "send_command"
    message = json.loads(event["data"])
    assert message == {
        "type": "command",
        "id": cmd.pk,
        "command": "restart_service",
        "arg": "display",
        "expires_at": int(cmd.expires_at.timestamp()),
    }
    assert cmd.status == FrameCommand.Status.SENT
    assert cmd.tier == "safe"


def test_an_unknown_service_is_refused(admin_user):
    frame = FrameFactory()
    online(frame)

    with pytest.raises(ValueError):
        send_command(frame, "restart_service", admin_user, "dropbear")
    assert not FrameCommand.objects.exists()


def test_results_only_apply_to_the_reporting_frame():
    frame, other = FrameFactory(), FrameFactory()
    cmd = FrameCommand.objects.create(
        frame=frame, command="reboot", tier="safe", expires_at=timezone.now()
    )

    assert not record_result(other, {"id": cmd.pk, "status": "accepted"})
    assert not record_result(frame, {"id": cmd.pk, "status": "sent"})
    assert record_result(
        frame, {"id": cmd.pk, "status": "rejected", "reason": "update installing"}
    )

    cmd.refresh_from_db()
    assert cmd.status == FrameCommand.Status.REJECTED
    assert cmd.reason == "update installing"
    assert not record_result(frame, {"id": cmd.pk, "status": "done"})


def test_unanswered_commands_expire():
    frame = FrameFactory()
    stale = FrameCommand.objects.create(
        frame=frame,
        command="reboot",
        tier="safe",
        expires_at=timezone.now() - timedelta(seconds=1),
    )
    fresh = FrameCommand.objects.create(
        frame=frame,
        command="reboot",
        tier="safe",
        expires_at=timezone.now() + timedelta(minutes=5),
    )

    assert expire_stale_commands() == 1
    stale.refresh_from_db()
    fresh.refresh_from_db()
    assert stale.status == FrameCommand.Status.EXPIRED
    assert fresh.status == FrameCommand.Status.SENT


def test_the_admin_confirms_before_sending(admin_client):
    frame = FrameFactory()
    receive = online(frame)

    confirm = admin_client.post(
        URL, {"action": "send_reboot", "_selected_action": frame.pk}
    )
    assert "admin/frames/confirm_frame_command.html" in [
        t.name for t in confirm.templates
    ]
    assert not FrameCommand.objects.exists()

    apply(admin_client, "send_reboot", frame)
    assert FrameCommand.objects.get().command == "reboot"
    assert json.loads(receive()["data"])["command"] == "reboot"


def test_a_risky_command_needs_the_typed_serial(admin_client):
    frame = FrameFactory()
    online(frame)

    apply(admin_client, "send_factory_reset", frame, confirm_serial="wrong")
    assert not FrameCommand.objects.exists()

    apply(
        admin_client,
        "send_factory_reset",
        frame,
        confirm_serial=frame.public_serial_number,
    )
    assert FrameCommand.objects.get().tier == "risky"


def test_shutdown_is_risky_and_reaches_the_frame(admin_client):
    frame = FrameFactory()
    receive = online(frame)

    apply(admin_client, "send_shutdown", frame, confirm_serial="wrong")
    assert not FrameCommand.objects.exists()

    apply(
        admin_client, "send_shutdown", frame, confirm_serial=frame.public_serial_number
    )
    assert FrameCommand.objects.get().tier == "risky"
    assert json.loads(receive()["data"])["command"] == "shutdown"


@pytest.mark.parametrize("command", ["enter_safe_mode", "exit_safe_mode"])
def test_safe_mode_commands_are_safe_and_reach_the_frame(admin_client, command):
    frame = FrameFactory()
    receive = online(frame)

    apply(admin_client, f"send_{command}", frame)

    assert FrameCommand.objects.get().tier == "safe"
    message = json.loads(receive()["data"])
    assert (message["command"], message["arg"]) == (command, "")


def test_an_offline_frame_gets_nothing(admin_client):
    frame = FrameFactory()

    response = apply(admin_client, "send_request_diagnostics", frame)

    assert "no open websocket" in response.content.decode()
    assert not FrameCommand.objects.exists()


def test_staff_without_admin_rights_cannot_send():
    frame = FrameFactory()
    online(frame)
    client = Client()
    client.force_login(UserFactory(is_active=True, is_staff=True, is_admin=False))

    apply(client, "send_reboot", frame)

    assert not FrameCommand.objects.exists()


def test_diagnostics_download_goes_through_nginx(admin_client, settings):
    frame = FrameFactory()
    diagnostics = FrameDiagnostics(frame=frame, trigger="admin", size=3)
    diagnostics.file.save("diagnostics.gz", ContentFile(b"abc"))

    response = admin_client.get(
        f"/api/admin/frames/framediagnostics/{diagnostics.pk}/download/"
    )

    assert response.status_code == 200
    assert (
        response["X-Accel-Redirect"] == "/api/media/protected/" + diagnostics.file.name
    )
    assert response["X-Accel-Redirect"].startswith(
        "/api/media/protected/frame-diagnostics/"
    )
    assert "attachment" in response["Content-Disposition"]


def test_frame_change_page_renders_diagnostics_inline(admin_client):
    frame = FrameFactory()
    diagnostics = FrameDiagnostics(frame=frame, trigger="admin", size=3)
    diagnostics.file.save("diagnostics.gz", ContentFile(b"abc"))

    response = admin_client.get(f"/api/admin/frames/frame/{frame.pk}/change/")

    assert response.status_code == 200
    assert f"/framediagnostics/{diagnostics.pk}/download/" in response.content.decode()


def test_diagnostics_download_needs_admin_rights():
    frame = FrameFactory()
    diagnostics = FrameDiagnostics.objects.create(
        frame=frame, trigger="admin", size=0, file="x.gz"
    )
    client = Client()
    client.force_login(UserFactory(is_active=True, is_staff=True, is_admin=False))

    response = client.get(
        f"/api/admin/frames/framediagnostics/{diagnostics.pk}/download/"
    )

    assert response.status_code == 403
