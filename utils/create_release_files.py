import os
import tarfile
import hashlib
import hmac
from dotenv import load_dotenv

RELEASE_FILES_OUTPUT_DIR = "releases"


def create_tar_gz(folder_path, output_filename):
    with tarfile.open(output_filename, "w:gz") as tar:
        for item in os.listdir(folder_path):
            item_path = os.path.join(folder_path, item)
            tar.add(item_path, arcname=item)
    print(f"Release created: {output_filename}")


def calculate_sha256(file_path):
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def encode_with_hmac(message, key):
    return hmac.new(key.encode(), message.encode(), hashlib.sha256).hexdigest()


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    load_dotenv(".env.release")

    folder_path = os.getenv("FOLDER_PATH")
    secret_env_path = os.getenv("SECRET_ENV_PATH")

    if not folder_path:
        print("Error: FOLDER_PATH not found in .env.release file.")
        return

    if not secret_env_path:
        print("Error: SECRET_ENV_PATH not found in .env.release file.")
        return

    if not os.path.isfile(secret_env_path):
        print(f"Error: Secret environment file does not exist: {secret_env_path}")
        return

    load_dotenv(secret_env_path)

    update_hash_secret_key = os.getenv("UPDATE_HASH_SECRET_KEY")

    if not update_hash_secret_key:
        print(f"Error: UPDATE_HASH_SECRET_KEY not found in {secret_env_path}")
        return

    version = input("Enter the version number: ").strip()

    if not os.path.isdir(folder_path):
        print(f"Error: Folder does not exist: {folder_path}")
        return

    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_filename = os.path.join(
        script_dir, RELEASE_FILES_OUTPUT_DIR, f"{version}.tar.gz"
    )
    create_tar_gz(folder_path, output_filename)

    sha256_hash = calculate_sha256(output_filename)
    print(f"SHA-256 checksum hash of the release file: {sha256_hash}")

    hmac_encoded_hash = encode_with_hmac(sha256_hash, update_hash_secret_key)
    print(f"Secret key encoded checksum hash: {hmac_encoded_hash}")

    hash_filename = output_filename + ".sha256"
    with open(hash_filename, "w") as f:
        f.write(hmac_encoded_hash)
    print(f"Secret key encoded checksum hash saved to: {hash_filename}")


if __name__ == "__main__":
    main()
