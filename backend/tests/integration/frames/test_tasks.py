import pytest
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone

from frames.models import Frame, FrameWebsocketConnection
from frames.tasks import close_and_delete_long_inactive_frame_websocket_connections

pytestmark = pytest.mark.django_db

CHANNEL = "test-channel-for-the-reaper"


def connection_for(frame, last_seen, channel_name=CHANNEL):
    Frame.objects.filter(pk=frame.pk).update(last_seen=last_seen)
    return FrameWebsocketConnection.objects.create(frame=frame, channel_name=channel_name)


@pytest.fixture
def frame():
    return Frame.objects.get(private_serial_number="SEED-PRIVATE-0003")


def stale_time(settings):
    return timezone.now() - timezone.timedelta(
        minutes=settings.FRAME_HEARTBEAT_TIMEOUT_MINUTES + 1
    )


def test_drops_a_connection_that_stopped_beating(frame, settings):
    connection = connection_for(frame, stale_time(settings))

    close_and_delete_long_inactive_frame_websocket_connections()

    assert not FrameWebsocketConnection.objects.filter(pk=connection.pk).exists()


def test_asks_the_channel_to_close_first(frame, settings):
    connection_for(frame, stale_time(settings))

    close_and_delete_long_inactive_frame_websocket_connections()

    assert async_to_sync(get_channel_layer().receive)(CHANNEL) == {
        "type": "close_connection"
    }


def test_a_frame_that_never_reported_counts_as_stale(frame):
    connection = connection_for(frame, None)

    close_and_delete_long_inactive_frame_websocket_connections()

    assert not FrameWebsocketConnection.objects.filter(pk=connection.pk).exists()


def test_a_live_connection_survives(frame):
    connection = connection_for(frame, timezone.now())

    close_and_delete_long_inactive_frame_websocket_connections()

    assert FrameWebsocketConnection.objects.filter(pk=connection.pk).exists()


def test_reports_what_it_closed(frame, settings):
    connection_for(frame, stale_time(settings))

    assert close_and_delete_long_inactive_frame_websocket_connections().startswith(
        "Closed and deleted 1 "
    )


def test_nothing_to_do_is_reported_as_zero():
    assert close_and_delete_long_inactive_frame_websocket_connections().startswith(
        "Closed and deleted 0 "
    )
