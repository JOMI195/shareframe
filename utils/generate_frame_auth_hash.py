import hashlib
import hmac
import time


def generate_auth_hash(private_serial_number, timestamp, frame_auth_secret_key):
    """
    Generate the authorization hash using the same algorithm as the server.
    """
    message = f"{private_serial_number}:{timestamp}".encode()

    digest = hmac.new(
        frame_auth_secret_key.encode(), message, digestmod=hashlib.sha256
    ).hexdigest()

    return digest


def generate_frame_auth_hash_manually():
    private_serial_number = input("Enter the private serial number: ").strip()
    frame_auth_secret_key = input("Enter the frame auth secret key: ").strip()

    timestamp = str(int(time.time()))

    generated_hash = generate_auth_hash(
        private_serial_number=private_serial_number,
        timestamp=timestamp,
        frame_auth_secret_key=frame_auth_secret_key,
    )

    print("Timestamp:", timestamp)
    print("Generated Hash:", generated_hash)


if __name__ == "__main__":
    generate_frame_auth_hash_manually()
