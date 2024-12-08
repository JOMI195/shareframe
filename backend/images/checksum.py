import hashlib


def get_sha256_sum_from_path(filepath: str) -> str:
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)

    return sha256_hash.hexdigest()


def get_sha256_sum_from_file(file) -> str:
    sha256_hash = hashlib.sha256()
    for byte_block in iter(lambda: file.read(4096), b""):
        sha256_hash.update(byte_block)

    return sha256_hash.hexdigest()


def compare_sha256_sums(sum1: str, sum2: str) -> bool:
    return sum1 == sum2
