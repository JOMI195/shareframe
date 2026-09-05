import json

import pytest
from channels.db import database_sync_to_async
from channels.testing import WebsocketCommunicator

from config.asgi import application
from frames.close_codes import WS_CLOSE_AUTH_REJECTED, WS_CLOSE_TOKEN_REVOKED
from frames.models import Frame, FrameWebsocketConnection
from tests.support.factories import FrameFactory, FrameTokenFactory, UserFactory

# The consumer reaches the ORM from another thread, so its writes must commit.
pytestmark = pytest.mark.django_db(transaction=True)

WS_URL = "/ws/frames/"


@database_sync_to_async
def make_frame():
    return FrameFactory(user=UserFactory())


@database_sync_to_async
def make_token(frame, **kwargs):
    return FrameTokenFactory(frame=frame, **kwargs).access_token


@database_sync_to_async
def reload(frame):
    return Frame.objects.get(pk=frame.pk)


async def connect(token=None):
    # AllowedHostsOriginValidator denies a websocket with no Origin at all.
    headers = [(b"origin", b"http://localhost"), (b"host", b"localhost")]
    if token:
        headers.append((b"authorization", f"Frame-Access-Token {token}".encode()))
    communicator = WebsocketCommunicator(application, WS_URL, headers=headers)
    connected, detail = await communicator.connect()
    return communicator, connected, detail


async def test_a_valid_token_is_accepted():
    communicator, connected, _ = await connect(await make_token(await make_frame()))

    assert connected
    await communicator.disconnect()


async def test_no_token_is_rejected():
    communicator, connected, code = await connect()

    assert not connected
    assert code == WS_CLOSE_AUTH_REJECTED
    await communicator.disconnect()


async def test_an_expired_token_is_rejected():
    communicator, connected, code = await connect(await make_token(await make_frame(), expired=True))

    assert not connected
    assert code == WS_CLOSE_AUTH_REJECTED
    await communicator.disconnect()


async def test_connecting_records_the_channel():
    communicator, _, _ = await connect(await make_token(await make_frame()))
    # connect() returns on accept(); the row is written just after it.
    await communicator.receive_nothing(timeout=0.3)

    assert await database_sync_to_async(FrameWebsocketConnection.objects.count)() == 1

    await communicator.disconnect()
    assert await database_sync_to_async(FrameWebsocketConnection.objects.count)() == 0


async def test_ping_is_answered_with_pong():
    communicator, _, _ = await connect(await make_token(await make_frame()))

    await communicator.send_to(text_data=json.dumps({"type": "ping", "timestamp": 42}))

    assert json.loads(await communicator.receive_from()) == {"type": "pong", "timestamp": 42}
    await communicator.disconnect()


async def test_heartbeat_updates_last_seen():
    frame = await make_frame()
    communicator, _, _ = await connect(await make_token(frame))

    await communicator.send_to(text_data=json.dumps({"type": "heartbeat"}))
    await communicator.receive_nothing(timeout=0.3)

    assert (await reload(frame)).last_seen is not None
    await communicator.disconnect()


async def test_config_updates_the_ip_and_version():
    frame = await make_frame()
    communicator, _, _ = await connect(await make_token(frame))

    await communicator.send_to(
        text_data=json.dumps(
            {"type": "config", "local_ip_address": "192.168.5.5", "version": "9.9.9"}
        )
    )
    await communicator.receive_nothing(timeout=0.3)

    reloaded = await reload(frame)
    assert reloaded.local_ip_address == "192.168.5.5"
    assert reloaded.version == "9.9.9"
    await communicator.disconnect()


async def test_close_connection_closes_with_the_revoked_code():
    communicator, _, _ = await connect(await make_token(await make_frame()))

    await communicator.send_to(text_data=json.dumps({"type": "close_connection"}))

    assert await communicator.receive_output() == {
        "type": "websocket.close",
        "code": WS_CLOSE_TOKEN_REVOKED,
    }
    await communicator.disconnect()


async def test_invalid_json_does_not_drop_the_connection():
    communicator, _, _ = await connect(await make_token(await make_frame()))

    await communicator.send_to(text_data="not json")

    assert await communicator.receive_nothing(timeout=0.3)
    await communicator.disconnect()


async def test_an_unknown_message_type_is_ignored():
    communicator, _, _ = await connect(await make_token(await make_frame()))

    await communicator.send_to(text_data=json.dumps({"type": "nonsense"}))

    assert await communicator.receive_nothing(timeout=0.3)
    await communicator.disconnect()


@database_sync_to_async
def make_sent_image(frame, **kwargs):
    from tests.support.factories import SentImageFactory

    return SentImageFactory(reciever=frame.user, **kwargs)


async def payloads_of(communicator, kind, limit=5):
    collected = []
    for _ in range(limit):
        if await communicator.receive_nothing(timeout=0.4):
            break
        message = json.loads(await communicator.receive_from())
        if message.get("type") == kind:
            collected.append(message)
    return collected


class TestMissingImages:
    async def test_an_image_the_board_lacks_is_pushed(self):
        frame = await make_frame()
        sent = await make_sent_image(frame)
        communicator, _, _ = await connect(await make_token(frame))

        await communicator.send_to(
            text_data=json.dumps({"type": "check_missing_images", "sent_image_ids": []})
        )

        pictures = await payloads_of(communicator, "picture")
        assert [p["sent_image_id"] for p in pictures] == [sent.id]
        await communicator.disconnect()

    async def test_an_image_the_board_already_has_is_not_resent(self):
        frame = await make_frame()
        sent = await make_sent_image(frame)
        communicator, _, _ = await connect(await make_token(frame))

        await communicator.send_to(
            text_data=json.dumps(
                {"type": "check_missing_images", "sent_image_ids": [sent.id]}
            )
        )

        assert await payloads_of(communicator, "picture") == []
        await communicator.disconnect()

    async def test_an_id_the_backend_no_longer_knows_is_cleared(self):
        frame = await make_frame()
        communicator, _, _ = await connect(await make_token(frame))

        await communicator.send_to(
            text_data=json.dumps(
                {"type": "check_missing_images", "sent_image_ids": [999999]}
            )
        )

        clears = await payloads_of(communicator, "clear_specific_sent_images")
        assert clears and clears[0]["sent_image_ids"] == [999999]
        await communicator.disconnect()

    async def test_the_misspelled_message_type_still_works(self):
        """A typo the older boards send; kept until every frame is updated."""
        frame = await make_frame()
        sent = await make_sent_image(frame)
        communicator, _, _ = await connect(await make_token(frame))

        await communicator.send_to(
            text_data=json.dumps({"type": "check_mssing_images", "sent_image_ids": []})
        )

        pictures = await payloads_of(communicator, "picture")
        assert [p["sent_image_id"] for p in pictures] == [sent.id]
        await communicator.disconnect()


class TestExpiryCheck:
    async def test_an_expired_image_is_cleared(self):
        frame = await make_frame()
        sent = await make_sent_image(frame, expired=True)
        communicator, _, _ = await connect(await make_token(frame))

        await communicator.send_to(
            text_data=json.dumps(
                {
                    "type": "check_sent_images_expiry",
                    "user_frame_images": [
                        {
                            "sent_image_id": sent.id,
                            "expires_at": int(sent.expires_at.timestamp()),
                        }
                    ],
                }
            )
        )

        clears = await payloads_of(communicator, "clear_specific_sent_images")
        assert clears and clears[0]["sent_image_ids"] == [sent.id]
        await communicator.disconnect()

    async def test_a_disagreeing_expiry_is_resent(self):
        frame = await make_frame()
        sent = await make_sent_image(frame)
        communicator, _, _ = await connect(await make_token(frame))

        await communicator.send_to(
            text_data=json.dumps(
                {
                    "type": "check_sent_images_expiry",
                    "user_frame_images": [
                        {"sent_image_id": sent.id, "expires_at": 1},
                    ],
                }
            )
        )

        pictures = await payloads_of(communicator, "picture")
        assert [p["sent_image_id"] for p in pictures] == [sent.id]
        await communicator.disconnect()

    async def test_an_agreeing_expiry_changes_nothing(self):
        frame = await make_frame()
        sent = await make_sent_image(frame)
        communicator, _, _ = await connect(await make_token(frame))

        await communicator.send_to(
            text_data=json.dumps(
                {
                    "type": "check_sent_images_expiry",
                    "user_frame_images": [
                        {
                            "sent_image_id": sent.id,
                            "expires_at": int(sent.expires_at.timestamp()),
                        }
                    ],
                }
            )
        )

        assert await communicator.receive_nothing(timeout=0.4)
        await communicator.disconnect()

    async def test_an_unknown_id_is_cleared(self):
        frame = await make_frame()
        communicator, _, _ = await connect(await make_token(frame))

        await communicator.send_to(
            text_data=json.dumps(
                {
                    "type": "check_sent_images_expiry",
                    "user_frame_images": [{"sent_image_id": 999999, "expires_at": 1}],
                }
            )
        )

        clears = await payloads_of(communicator, "clear_specific_sent_images")
        assert clears and clears[0]["sent_image_ids"] == [999999]
        await communicator.disconnect()

    async def test_a_malformed_entry_is_skipped(self):
        frame = await make_frame()
        communicator, _, _ = await connect(await make_token(frame))

        await communicator.send_to(
            text_data=json.dumps(
                {"type": "check_sent_images_expiry", "user_frame_images": [{"nope": 1}]}
            )
        )

        assert await communicator.receive_nothing(timeout=0.4)
        await communicator.disconnect()
