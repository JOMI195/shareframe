import pytest
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from frames.models import Frame, FrameWebsocketConnection

pytestmark = pytest.mark.django_db

CHANNEL = "test-channel-for-signals"


@pytest.fixture
def connected_frame():
    frame = Frame.objects.get(private_serial_number="SEED-PRIVATE-0003")
    FrameWebsocketConnection.objects.create(frame=frame, channel_name=CHANNEL)
    return frame


def next_message():
    layer = get_channel_layer()
    return async_to_sync(layer.receive)(CHANNEL)


def test_deactivating_a_frame_closes_its_connection(connected_frame):
    connected_frame.is_active = False
    connected_frame.save()

    assert next_message() == {"type": "close_connection"}


def test_unassigning_the_owner_closes_the_connection(connected_frame):
    connected_frame.user = None
    connected_frame.save()

    assert next_message() == {"type": "close_connection"}


def test_an_ordinary_save_sends_nothing(connected_frame, settings):
    connected_frame.version = "9.9.9"
    connected_frame.save()

    layer = get_channel_layer()
    # The in-memory layer blocks on an empty channel, so peek instead of receive.
    assert not layer.channels.get(CHANNEL)


def test_a_frame_without_a_connection_is_a_no_op():
    spare = Frame.objects.get(private_serial_number="SEED-PRIVATE-0005")

    spare.is_active = False
    spare.save()
