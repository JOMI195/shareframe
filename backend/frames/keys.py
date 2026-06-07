import base64
import hashlib


def public_key_fingerprint(public_key_b64: str) -> str:
    """
    Derive the human-readable id from an ed25519 public key.

    Returns base32(SHA-256(raw_public_key)[:10]) uppercased and grouped as
    XXXX-XXXX-XXXX-XXXX. This is the single source of truth for a frame's
    public_serial_number when it is provisioned with a keypair, and must match
    what the board displays.
    """
    raw = base64.b64decode(public_key_b64)
    digest = hashlib.sha256(raw).digest()[:10]
    b32 = base64.b32encode(digest).decode("ascii").rstrip("=")
    return "-".join(b32[i : i + 4] for i in range(0, len(b32), 4))
