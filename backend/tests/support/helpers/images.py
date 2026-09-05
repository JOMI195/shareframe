"""In-memory upload files plus the checksum the API insists on."""

import io

from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image as PILImage

from images.checksum import get_sha256_sum_from_file


def image_bytes(fmt="PNG", size=(40, 30), color=(120, 160, 200)):
    buffer = io.BytesIO()
    PILImage.new("RGB", size, color).save(buffer, format=fmt)
    return buffer.getvalue()


def upload_file(name="test-upload.png", fmt="PNG", **kwargs):
    content = image_bytes(fmt=fmt, **kwargs)
    content_type = "image/png" if fmt == "PNG" else "image/jpeg"
    return SimpleUploadedFile(name, content, content_type=content_type)


def upload_with_checksum(name="test-upload.png", fmt="PNG", **kwargs):
    upload = upload_file(name=name, fmt=fmt, **kwargs)
    checksum = get_sha256_sum_from_file(upload)
    upload.seek(0)
    return upload, checksum
