import os
import tarfile
import hashlib


def create_tar_gz(folder_path, output_filename):
    with tarfile.open(output_filename, "w:gz") as tar:
        for item in os.listdir(folder_path):
            item_path = os.path.join(folder_path, item)
            tar.add(item_path, arcname=item)
    print(f"Archive created: {output_filename}")


def calculate_sha256(file_path):
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def main():
    folder_path = input("Enter the folder path: ").strip()
    version = input("Enter the version number: ").strip()

    if not os.path.isdir(folder_path):
        print("Error: Folder does not exist.")
        return

    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_filename = os.path.join(script_dir, f"{version}.tar.gz")
    create_tar_gz(folder_path, output_filename)

    sha256_hash = calculate_sha256(output_filename)
    print(f"SHA-256 Hash: {sha256_hash}")

    hash_filename = output_filename + ".sha256"
    with open(hash_filename, "w") as f:
        f.write(sha256_hash)
    print(f"SHA-256 hash saved to: {hash_filename}")


if __name__ == "__main__":
    main()
