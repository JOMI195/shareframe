import base64
import hashlib
import hmac
import json
import time


class SecurePayload:
    """
    Static utility for secure payload handling
    """

    @staticmethod
    def encrypt(payload, secret):
        """
        Encrypt payload with timestamp
        """

        if not isinstance(secret, bytes):
            secret = secret.encode("utf-8")

        secure_payload = {"data": payload, "timestamp": int(time.time())}

        payload_json = json.dumps(secure_payload)

        signature = hmac.new(
            secret, payload_json.encode("utf-8"), hashlib.sha256
        ).hexdigest()

        payload = f"{signature}:{payload_json}"

        return base64.urlsafe_b64encode(payload.encode("utf-8")).decode("utf-8")

    @staticmethod
    def decrypt(payload, secret, max_age=300):
        """
        Decrypt and validate payload
        """

        if not isinstance(secret, bytes):
            secret = secret.encode("utf-8")

        try:
            # Decode base64
            decoded = base64.urlsafe_b64decode(payload.encode("utf-8")).decode("utf-8")

            # Split signature and payload
            signature, payload_json = decoded.split(":", 1)

            # Verify signature
            expected_signature = hmac.new(
                secret, payload_json.encode("utf-8"), hashlib.sha256
            ).hexdigest()

            # Compare signatures
            if not hmac.compare_digest(signature, expected_signature):
                raise ValueError("Invalid signature")

            # Parse payload
            secure_payload = json.loads(payload_json)

            # Check timestamp
            current_time = int(time.time())
            if current_time - secure_payload["timestamp"] > max_age:
                raise ValueError("Token expired")

            return secure_payload["data"]

        except Exception as e:
            raise ValueError(f"Decryption failed: {str(e)}")
