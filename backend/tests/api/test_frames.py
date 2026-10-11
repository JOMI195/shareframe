import time
from types import SimpleNamespace

import pytest

from frames.models import Frame
from securePayload.securePayload import SecurePayload
from sent_images.models import SentImage, SentImageStatus
from tests.support import seed
from tests.support.factories import (
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

    def test_the_serial_is_required(self, alice):
        response = alice.post(f"{URL}register-user/", {}, format="json")

        assert response.status_code == 400

    def test_an_unknown_serial_is_not_found(self, alice):
        response = alice.post(
            f"{URL}register-user/",
            {"public_serial_number": "AAAA-BBBB-CCCC-DDDD"},
            format="json",
        )

        assert response.status_code == 404

    def test_a_frame_someone_else_owns_is_refused(self, alice, alice_entry):
        other = Frame.objects.get(private_serial_number="SEED-PRIVATE-0001")

        response = alice.post(
            f"{URL}register-user/",
            {"public_serial_number": other.public_serial_number},
            format="json",
        )

        assert response.status_code == 400

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

    def test_an_unparsable_expiry_is_rejected(self, world):
        response = self.send(
            world,
            reciever_username=world.friend.username,
            image_id=world.image.id,
            expiry_unix_timestamp="whenever",
        )

        assert response.status_code == 400

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

    def test_a_frame_token_is_required(self, client):
        response = client.post(
            self.url(),
            {"local_ip_address": "192.168.9.9", "version": "8.0.0"},
            format="json",
        )

        assert response.status_code == 403
