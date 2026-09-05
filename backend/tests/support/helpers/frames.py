"""Header builders for the two device auth schemes a board can use."""

import base64
import hashlib
import hmac
import time

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from django.conf import settings

from frames.keys import public_key_fingerprint


def public_key_b64(seed_b64):
    private = Ed25519PrivateKey.from_private_bytes(base64.b64decode(seed_b64))
    return base64.b64encode(private.public_key().public_bytes_raw()).decode()


def serial_for(seed_b64):
    """The public_serial_number seed_dev_data derives for this seed."""
    return public_key_fingerprint(public_key_b64(seed_b64))


def signature_headers(seed_b64, serial=None, timestamp=None):
    serial = serial or serial_for(seed_b64)
    timestamp = str(int(time.time()) if timestamp is None else timestamp)
    private = Ed25519PrivateKey.from_private_bytes(base64.b64decode(seed_b64))
    signature = private.sign(f"{serial}:{timestamp}".encode())
    return {
        "Authorization": f"Ed25519-Sig {base64.b64encode(signature).decode()}",
        "X-Frame-ID": serial,
        "X-Timestamp": timestamp,
    }


def hmac_headers(private_serial, timestamp=None, secret=None):
    """LEGACY headers for FrameHTTPAuth (old Python boards)."""
    timestamp = str(int(time.time()) if timestamp is None else timestamp)
    secret = (secret or settings.FRAME_AUTH_SECRET_KEY).encode()
    digest = hmac.new(
        secret, f"{private_serial}:{timestamp}".encode(), hashlib.sha256
    ).hexdigest()
    return {"Authorization": f"Auth-Hash {digest}", "X-Timestamp": timestamp}


def token_headers(access_token):
    return {"Authorization": f"Frame-Access-Token {access_token}"}
