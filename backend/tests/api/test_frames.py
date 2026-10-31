import gzip
import json
import time
from types import SimpleNamespace

import pytest

from frames.consumers import FrameWebSocketConsumer
from frames.models import Frame, FrameCommand, FrameDiagnostics
from securePayload.securePayload import SecurePayload
from sent_images.models import SentImage, SentImageStatus
from tests.support import seed
from tests.support.factories import (
    FrameFactory,
    FrameTokenFactory,
    FriendshipFactory,
    ImageFactory,
    UserFactory,
)
from tests.support.helpers.frames import (
    hmac_headers,
    serial_for,
    signature_headers,
    token_headers,
)
from user_stats.models import UserStats

pytestmark = pytest.mark.django_db

URL = "/api/frames/"
ALICE_FRAME = "seed-frame-alice-living"


@pytest.fixture
def alice_entry():
    return seed.frames()[ALICE_FRAME]


@pytest.fixture
def alice_frame(alice_entry):
    return Frame.objects.get(private_serial_number=alice_entry["private_serial_number"])


@pytest.fixture
def spare_entry():
    return seed.unowned_frame()


@pytest.fixture
def inactive_alice_frame(alice_frame):
    Frame.objects.filter(pk=alice_frame.pk).update(is_active=False)
    return alice_frame


def test_requires_authentication(client):
    assert client.get(URL).status_code == 401


class TestListAndRetrieve:
    def test_lists_only_the_users_own_frames(self, alice):
        response = alice.get(URL)

        assert response.status_code == 200
        assert len(response.data) == len(seed.frames_of(seed.ALICE))

    def test_retrieves_an_own_frame(self, alice, alice_frame):
        response = alice.get(f"{URL}{alice_frame.pk}/")

        assert response.status_code == 200
        assert response.data["public_serial_number"] == alice_frame.public_serial_number

    def test_another_users_frame_is_refused(self, alice):
        theirs = Frame.objects.get(private_serial_number="SEED-PRIVATE-0001")

        assert alice.get(f"{URL}{theirs.pk}/").status_code == 400

    def test_an_inactive_frame_is_not_listed(self, alice, inactive_alice_frame):
        ids = {frame["id"] for frame in alice.get(URL).data}

        assert inactive_alice_frame.pk not in ids

    def test_an_inactive_frame_is_not_retrieved(self, alice, inactive_alice_frame):
        assert alice.get(f"{URL}{inactive_alice_frame.pk}/").status_code == 400


@pytest.mark.parametrize(
    "method,path", [("post", ""), ("put", "1/"), ("patch", "1/"), ("delete", "1/")]
)
def test_the_crud_verbs_are_disabled(alice, method, path):
    response = getattr(alice, method)(f"{URL}{path}", {}, format="json")

    assert response.status_code == 405


class TestRegister:
    def test_claims_an_unowned_frame(self, alice, spare_entry):
        serial = serial_for(spare_entry["seed_b64"])

        response = alice.post(
            f"{URL}register-user/", {"public_serial_number": serial}, format="json"
        )

        assert response.status_code == 200
        assert (
            Frame.objects.get(public_serial_number=serial).user.username == seed.ALICE
        )

    def test_the_claim_is_audited(self, alice, spare_entry, caplog):
        serial = serial_for(spare_entry["seed_b64"])

        with caplog.at_level("INFO", logger="admin.audit"):
            alice.post(
                f"{URL}register-user/", {"public_serial_number": serial}, format="json"
            )

        assert f"Frame {serial} registered to" in caplog.text

    def test_the_serial_is_required(self, alice):
        response = alice.post(f"{URL}register-user/", {}, format="json")

        assert response.status_code == 400
        assert response.data["code"] == "serial_required"

    def test_an_unknown_serial_is_not_found(self, alice):
        response = alice.post(
            f"{URL}register-user/",
            {"public_serial_number": "AAAA-BBBB-CCCC-DDDD"},
            format="json",
        )

        assert response.status_code == 404
        assert response.data["code"] == "frame_unavailable"

    def test_a_frame_someone_else_owns_is_refused(self, alice, alice_entry):
        other = Frame.objects.get(private_serial_number="SEED-PRIVATE-0001")

        response = alice.post(
            f"{URL}register-user/",
            {"public_serial_number": other.public_serial_number},
            format="json",
        )

        assert response.status_code == 400
        # Same code as an unknown serial, so serials cannot be probed.
        assert response.data["code"] == "frame_unavailable"

    def test_the_serial_format_is_four_groups_of_four(self, spare_entry):
        """The register dialog's schema matches this shape."""
        serial = serial_for(spare_entry["seed_b64"])

        assert len(serial.split("-")) == 4

    def test_an_inactive_frame_is_not_found(self, alice, spare_entry):
        serial = serial_for(spare_entry["seed_b64"])
        Frame.objects.filter(public_serial_number=serial).update(is_active=False)

        response = alice.post(
            f"{URL}register-user/", {"public_serial_number": serial}, format="json"
        )

        assert response.status_code == 404
        assert Frame.objects.get(public_serial_number=serial).user is None


class TestUnregister:
    def test_hands_an_own_frame_back(self, alice, alice_frame):
        response = alice.post(
            f"{URL}unregister-user/",
            {"public_serial_number": alice_frame.public_serial_number},
            format="json",
        )

        assert response.status_code == 200
        alice_frame.refresh_from_db()
        assert alice_frame.user is None

    def test_the_release_is_audited(self, alice, alice_frame, caplog):
        serial = alice_frame.public_serial_number

        with caplog.at_level("INFO", logger="admin.audit"):
            alice.post(
                f"{URL}unregister-user/",
                {"public_serial_number": serial},
                format="json",
            )

        assert f"Frame {serial} unregistered from" in caplog.text

    def test_the_serial_is_required(self, alice):
        assert (
            alice.post(f"{URL}unregister-user/", {}, format="json").status_code == 400
        )

    def test_another_users_frame_cannot_be_released(self, alice):
        theirs = Frame.objects.get(private_serial_number="SEED-PRIVATE-0001")

        response = alice.post(
            f"{URL}unregister-user/",
            {"public_serial_number": theirs.public_serial_number},
            format="json",
        )

        assert response.status_code == 404
        theirs.refresh_from_db()
        assert theirs.user is not None

    def test_an_inactive_frame_cannot_be_released(self, alice, inactive_alice_frame):
        response = alice.post(
            f"{URL}unregister-user/",
            {"public_serial_number": inactive_alice_frame.public_serial_number},
            format="json",
        )

        assert response.status_code == 404
        inactive_alice_frame.refresh_from_db()
        assert inactive_alice_frame.user is not None


# async_to_sync reaches the ORM on its own connection, so the data must be committed.
@pytest.mark.django_db(transaction=True)
class TestSendImage:
    @pytest.fixture
    def world(self, client_as):
        sender = UserFactory(is_active=True)
        friend = UserFactory(is_active=True)
        stranger = UserFactory(is_active=True)
        pending = UserFactory(is_active=True)
        FriendshipFactory(sender=sender, reciever=friend, status="accepted")
        FriendshipFactory(sender=sender, reciever=pending, status="pending")
        return SimpleNamespace(
            client=client_as(sender),
            image=ImageFactory(user=sender),
            friends_image=ImageFactory(user=friend),
            friend=friend,
            stranger=stranger,
            pending=pending,
            sender=sender,
        )

    def send(self, world, **payload):
        return world.client.post(f"{URL}send-image/", payload, format="json")

    def test_sends_to_an_accepted_friend(self, world):
        response = self.send(
            world, reciever_username=world.friend.username, image_id=world.image.id
        )

        assert response.status_code == 200

    def test_a_failed_push_is_logged(self, world, monkeypatch, caplog):
        async def broken(**kwargs):
            raise RuntimeError("channel layer down")

        monkeypatch.setattr(
            FrameWebSocketConsumer, "send_picture_to_user_frames", broken
        )

        with caplog.at_level("ERROR", logger="frames.views"):
            response = self.send(
                world, reciever_username=world.friend.username, image_id=world.image.id
            )

        assert response.status_code == 500
        assert f"Sending image {world.image.id}" in caplog.text
        assert "channel layer down" in caplog.text

    def test_the_send_is_counted_for_both_sides(self, world):
        self.send(
            world, reciever_username=world.friend.username, image_id=world.image.id
        )

        assert UserStats.objects.get(user=world.sender).images_sent == 1
        assert UserStats.objects.get(user=world.friend).images_received == 1

    def test_a_refused_send_is_not_counted(self, world):
        self.send(
            world, reciever_username=world.stranger.username, image_id=world.image.id
        )

        assert not UserStats.objects.filter(user=world.sender).exists()

    def test_sends_to_your_own_frames(self, world):
        response = self.send(
            world, reciever_username=world.sender.username, image_id=world.image.id
        )

        assert response.status_code == 200

    def test_a_receiver_is_required(self, world):
        assert self.send(world, image_id=world.image.id).status_code == 400

    def test_an_image_id_is_required(self, world):
        assert (
            self.send(world, reciever_username=world.friend.username).status_code == 400
        )

    def test_someone_elses_image_cannot_be_sent(self, world):
        response = self.send(
            world,
            reciever_username=world.friend.username,
            image_id=world.friends_image.id,
        )

        assert response.status_code == 404

    def test_a_stranger_cannot_be_sent_to(self, world):
        response = self.send(
            world, reciever_username=world.stranger.username, image_id=world.image.id
        )

        assert response.status_code == 404

    def test_a_pending_friendship_is_not_enough(self, world):
        response = self.send(
            world, reciever_username=world.pending.username, image_id=world.image.id
        )

        assert response.status_code == 404

    def test_an_unknown_receiver_is_not_found(self, world):
        response = self.send(
            world, reciever_username="nobody_at_all", image_id=world.image.id
        )

        assert response.status_code == 404

    def test_an_expiry_in_the_past_is_rejected(self, world):
        response = self.send(
            world,
            reciever_username=world.friend.username,
            image_id=world.image.id,
            expiry_unix_timestamp=int(time.time()) - 60,
        )

        assert response.status_code == 400
        assert response.json() == {
            "code": "timestamp_past",
            "detail": "The provided timestamp must be in the future.",
        }

    def test_an_unparsable_expiry_is_rejected(self, world):
        response = self.send(
            world,
            reciever_username=world.friend.username,
            image_id=world.image.id,
            expiry_unix_timestamp="whenever",
        )

        assert response.status_code == 400
        assert response.json() == {
            "code": "timestamp_invalid",
            "detail": "Invalid Unix timestamp provided.",
        }

    def test_a_future_expiry_is_accepted(self, world):
        response = self.send(
            world,
            reciever_username=world.friend.username,
            image_id=world.image.id,
            expiry_unix_timestamp=int(time.time()) + 3600,
        )

        assert response.status_code == 200

    def test_a_scheduled_send_is_stored_not_pushed(self, world):
        scheduled_at = int(time.time()) + 3600

        response = self.send(
            world,
            reciever_username=world.friend.username,
            image_id=world.image.id,
            scheduled_unix_timestamp=scheduled_at,
            expiry_unix_timestamp=scheduled_at + 3600,
        )

        assert response.status_code == 201
        assert response.data["status"] == SentImageStatus.SCHEDULED
        sent = SentImage.objects.get(pk=response.data["id"])
        assert int(sent.scheduled_for.timestamp()) == scheduled_at
        assert not UserStats.objects.filter(user=world.sender).exists()

    def test_a_schedule_in_the_past_is_rejected(self, world):
        response = self.send(
            world,
            reciever_username=world.friend.username,
            image_id=world.image.id,
            scheduled_unix_timestamp=int(time.time()) - 60,
        )

        assert response.status_code == 400

    def test_a_schedule_too_far_ahead_is_rejected(self, world, settings):
        too_far = time.time() + (settings.SENT_IMAGE_MAX_SCHEDULE_DAYS + 1) * 86400

        response = self.send(
            world,
            reciever_username=world.friend.username,
            image_id=world.image.id,
            scheduled_unix_timestamp=int(too_far),
        )

        assert response.status_code == 400

    def test_an_expiry_before_the_schedule_is_rejected(self, world):
        scheduled_at = int(time.time()) + 3600

        response = self.send(
            world,
            reciever_username=world.friend.username,
            image_id=world.image.id,
            scheduled_unix_timestamp=scheduled_at,
            expiry_unix_timestamp=scheduled_at - 60,
        )

        assert response.status_code == 400


class TestObtainToken:
    def test_a_signature_buys_a_token(self, client, alice_entry):
        response = client.post(
            f"{URL}obtain-frame-token/",
            {},
            format="json",
            headers=signature_headers(alice_entry["seed_b64"]),
        )

        assert response.status_code == 200
        assert response.data["access_token"]

    def test_an_unowned_frame_is_told_to_get_registered(self, client, spare_entry):
        response = client.post(
            f"{URL}obtain-frame-token/",
            {},
            format="json",
            headers=signature_headers(spare_entry["seed_b64"]),
        )

        assert response.status_code == 403
        assert response.data["code"] == "frame_unregistered"

    def test_without_a_signature_it_is_forbidden(self, client):
        # DRF answers 403, not 401: no authenticator sets a WWW-Authenticate header.
        assert (
            client.post(f"{URL}obtain-frame-token/", {}, format="json").status_code
            == 403
        )

    def test_the_legacy_hmac_route_still_works(self, client, alice_entry):
        response = client.post(
            f"{URL}obtain-frame-auth-token/",
            {},
            format="json",
            headers=hmac_headers(alice_entry["private_serial_number"]),
        )

        assert response.status_code == 200
        assert response.data["access_token"]

    def test_the_legacy_ws_route_takes_the_private_serial(self, client, alice_entry):
        response = client.post(
            f"{URL}obtain-frame-ws-auth-token/",
            {"private_serial_number": alice_entry["private_serial_number"]},
            format="json",
        )

        assert response.status_code == 200

    def test_the_legacy_ws_route_needs_the_serial(self, client):
        assert (
            client.post(
                f"{URL}obtain-frame-ws-auth-token/", {}, format="json"
            ).status_code
            == 400
        )

    def test_an_unknown_serial_is_not_found(self, client):
        response = client.post(
            f"{URL}obtain-frame-ws-auth-token/",
            {"private_serial_number": "NOPE"},
            format="json",
        )

        assert response.status_code == 404


@pytest.mark.parametrize("path", ["verify-frame-token", "verify-frame-auth-token"])
class TestVerifyToken:
    def test_accepts_a_live_token(self, client, alice_frame, path):
        token = FrameTokenFactory(frame=alice_frame)

        response = client.post(
            f"{URL}{path}/", {"access_token": token.access_token}, format="json"
        )

        assert response.status_code == 200
        assert response.data["valid"] is True

    def test_the_token_is_required(self, client, path):
        assert client.post(f"{URL}{path}/", {}, format="json").status_code == 400

    def test_an_unknown_token_is_unauthorized(self, client, path):
        response = client.post(
            f"{URL}{path}/",
            {"access_token": "11111111-2222-3333-4444-555555555555"},
            format="json",
        )

        assert response.status_code == 401

    def test_an_expired_token_is_unauthorized(self, client, alice_frame, path):
        token = FrameTokenFactory(frame=alice_frame, expired=True)

        response = client.post(
            f"{URL}{path}/", {"access_token": token.access_token}, format="json"
        )

        assert response.status_code == 401


class TestOTP:
    def test_the_owner_can_ask_for_an_otp(self, alice, alice_frame):
        response = alice.post(
            f"{URL}{alice_frame.pk}/obtain-frame-otp/", {}, format="json"
        )

        assert response.status_code == 200
        assert len(response.data["otp"]) == 6

    def test_another_users_frame_gives_no_otp(self, alice):
        theirs = Frame.objects.get(private_serial_number="SEED-PRIVATE-0001")

        assert (
            alice.post(
                f"{URL}{theirs.pk}/obtain-frame-otp/", {}, format="json"
            ).status_code
            == 404
        )

    def test_an_inactive_frame_gives_no_otp(self, alice, inactive_alice_frame):
        response = alice.post(
            f"{URL}{inactive_alice_frame.pk}/obtain-frame-otp/", {}, format="json"
        )

        assert response.status_code == 404

    def test_the_frame_verifies_the_code(self, client, alice_frame):
        code = alice_frame.generate_otp()
        token = FrameTokenFactory(frame=alice_frame)

        response = client.post(
            f"{URL}verify-otp/",
            {"otp": code},
            format="json",
            headers=token_headers(token.access_token),
        )

        assert response.status_code == 200
        assert response.data["valid"] is True

    def test_a_wrong_code_is_unauthorized(self, client, alice_frame):
        alice_frame.generate_otp()
        token = FrameTokenFactory(frame=alice_frame)

        response = client.post(
            f"{URL}verify-otp/",
            {"otp": "000000"},
            format="json",
            headers=token_headers(token.access_token),
        )

        assert response.status_code == 401

    def test_a_wrong_code_is_audited(self, client, alice_frame, caplog):
        alice_frame.generate_otp()
        token = FrameTokenFactory(frame=alice_frame)

        with caplog.at_level("INFO", logger="admin.audit"):
            client.post(
                f"{URL}verify-otp/",
                {"otp": "000000"},
                format="json",
                headers=token_headers(token.access_token),
            )

        assert (
            f"OTP rejected for frame {alice_frame.public_serial_number}" in caplog.text
        )

    def test_the_code_is_required(self, client, alice_frame):
        token = FrameTokenFactory(frame=alice_frame)

        response = client.post(
            f"{URL}verify-otp/",
            {},
            format="json",
            headers=token_headers(token.access_token),
        )

        assert response.status_code == 400

    def test_verification_needs_a_frame_token(self, client, alice_frame):
        code = alice_frame.generate_otp()

        assert (
            client.post(f"{URL}verify-otp/", {"otp": code}, format="json").status_code
            == 403
        )

    def test_the_legacy_route_answers_with_a_secure_payload(
        self, client, alice_frame, settings
    ):
        code = alice_frame.generate_otp()
        token = FrameTokenFactory(frame=alice_frame)

        response = client.post(
            f"{URL}verify-frame-otp/",
            {"otp": code},
            format="json",
            headers=token_headers(token.access_token),
        )

        assert response.status_code == 200
        assert SecurePayload.decrypt(
            response.data["secure_payload"], settings.FRAME_AUTH_SECRET_KEY
        ) == {"valid": True}


class TestHeartbeat:
    def url(self):
        return f"{URL}frame-hearbeat/"

    def test_records_the_ip_version_and_time(self, client, alice_frame):
        token = FrameTokenFactory(frame=alice_frame)

        response = client.post(
            self.url(),
            {"local_ip_address": "192.168.9.9", "version": "8.0.0"},
            format="json",
            headers=token_headers(token.access_token),
        )

        assert response.status_code == 200
        alice_frame.refresh_from_db()
        assert alice_frame.local_ip_address == "192.168.9.9"
        assert alice_frame.version == "8.0.0"
        assert alice_frame.last_seen is not None
        assert alice_frame.last_heartbeat == alice_frame.last_seen

    def test_the_ip_is_required(self, client, alice_frame):
        token = FrameTokenFactory(frame=alice_frame)

        response = client.post(
            self.url(),
            {"version": "8.0.0"},
            format="json",
            headers=token_headers(token.access_token),
        )

        assert response.status_code == 400

    def test_the_version_is_required(self, client, alice_frame):
        token = FrameTokenFactory(frame=alice_frame)

        response = client.post(
            self.url(),
            {"local_ip_address": "192.168.9.9"},
            format="json",
            headers=token_headers(token.access_token),
        )

        assert response.status_code == 400

    def test_each_event_is_logged_with_the_frame_serial(
        self, client, alice_frame, caplog
    ):
        token = FrameTokenFactory(frame=alice_frame)
        event = {
            "seq": 7,
            "time": "2026-10-16T10:00:00",
            "source": "crash",
            "message": "shareframe-display signal 11",
        }

        with caplog.at_level("INFO", logger="frames.telemetry"):
            response = client.post(
                self.url(),
                {
                    "local_ip_address": "192.168.9.9",
                    "version": "8.0.0",
                    "events": [event, "junk"],
                },
                format="json",
                headers=token_headers(token.access_token),
            )

        assert response.status_code == 200
        lines = [r.getMessage() for r in caplog.records if r.name == "frames.telemetry"]
        assert [json.loads(line) for line in lines] == [
            {
                "kind": "event",
                "serial_number": alice_frame.public_serial_number,
                **event,
            }
        ]

    def test_keeps_the_body_without_events_as_telemetry(self, client, alice_frame):
        token = FrameTokenFactory(frame=alice_frame)
        body = {
            "local_ip_address": "192.168.9.9",
            "version": "8.0.0",
            "cpu_temp_celsius": 47.2,
            "display_running": True,
        }

        client.post(
            self.url(),
            {**body, "events": [{"seq": 1}]},
            format="json",
            headers=token_headers(token.access_token),
        )

        alice_frame.refresh_from_db()
        assert alice_frame.last_telemetry == body

    def test_a_frame_token_is_required(self, client):
        response = client.post(
            self.url(),
            {"local_ip_address": "192.168.9.9", "version": "8.0.0"},
            format="json",
        )

        assert response.status_code == 403


class TestDiagnosticsUpload:
    def url(self, query="?trigger=owner"):
        return f"{URL}frame-diagnostics/{query}"

    def post(self, client, frame, body, query="?trigger=owner"):
        token = getattr(frame, "frame_token", None) or FrameTokenFactory(frame=frame)
        return client.post(
            self.url(query),
            body,
            content_type="application/gzip",
            headers=token_headers(token.access_token),
        )

    def test_stores_the_package_and_logs_its_lines(self, client, alice_frame, caplog):
        package = gzip.compress(b"===== events =====\n1 t [boot] ok\n")

        with caplog.at_level("INFO", logger="frames.telemetry"):
            response = self.post(client, alice_frame, package)

        assert response.status_code == 201
        diagnostics = FrameDiagnostics.objects.get(pk=response.json()["id"])
        assert diagnostics.frame == alice_frame
        assert diagnostics.trigger == "owner"
        assert diagnostics.file.read() == package
        lines = [
            json.loads(r.getMessage())
            for r in caplog.records
            if r.name == "frames.telemetry"
        ]
        assert [line["line"] for line in lines] == [
            "===== events =====",
            "1 t [boot] ok",
        ]
        assert {line["serial_number"] for line in lines} == {
            alice_frame.public_serial_number
        }

    def test_links_the_command_of_the_same_frame_only(self, client, alice_frame):
        own = FrameCommand.objects.create(
            frame=alice_frame,
            command="reboot",
            tier="safe",
            expires_at=alice_frame.registered_at,
        )
        other = FrameCommand.objects.create(
            frame=FrameFactory(),
            command="reboot",
            tier="safe",
            expires_at=alice_frame.registered_at,
        )
        package = gzip.compress(b"x")

        first = self.post(
            client, alice_frame, package, f"?trigger=pre-reboot&command_id={own.pk}"
        )
        second = self.post(
            client, alice_frame, package, f"?trigger=admin&command_id={other.pk}"
        )

        assert FrameDiagnostics.objects.get(pk=first.json()["id"]).command == own
        assert FrameDiagnostics.objects.get(pk=second.json()["id"]).command is None

    def test_rejects_an_unknown_trigger(self, client, alice_frame):
        response = self.post(client, alice_frame, gzip.compress(b"x"), "?trigger=cron")
        assert response.status_code == 400

    def test_rejects_non_gzip_and_truncated_packages(self, client, alice_frame):
        assert self.post(client, alice_frame, b"plain text").status_code == 400
        assert (
            self.post(client, alice_frame, gzip.compress(b"x" * 1000)[:-10]).status_code
            == 400
        )
        assert not FrameDiagnostics.objects.exists()

    def test_rejects_a_zip_bomb(self, client, alice_frame):
        bomb = gzip.compress(b"\0" * (5 * 1024 * 1024))
        assert len(bomb) < 256 * 1024

        response = self.post(client, alice_frame, bomb)

        assert response.status_code == 413
        assert not FrameDiagnostics.objects.exists()

    def test_rejects_an_oversized_upload(self, client, alice_frame):
        response = self.post(client, alice_frame, b"\0" * (256 * 1024 + 1))
        assert response.status_code == 413

    def test_a_frame_token_is_required(self, client):
        response = client.post(
            self.url(), gzip.compress(b"x"), content_type="application/gzip"
        )
        assert response.status_code == 403
