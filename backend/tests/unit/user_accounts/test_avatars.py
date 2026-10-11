import io

import pytest
from PIL import Image as PILImage

from tests.support.helpers.images import image_bytes
from user_accounts.avatars import AVATAR_SIZE, InvalidAvatar, process_avatar

RED = (220, 30, 30)
BLUE = (30, 30, 220)


def _open(content):
    return PILImage.open(io.BytesIO(content.read()))


def _halves(size=(200, 100)):
    image = PILImage.new("RGB", size, BLUE)
    image.paste(RED, (0, 0, size[0] // 2, size[1]))
    return image


def _closer_to_red(pixel):
    return abs(pixel[0] - RED[0]) < abs(pixel[0] - BLUE[0])


def test_output_is_a_square_jpeg():
    result = _open(process_avatar(io.BytesIO(image_bytes(size=(300, 120)))))

    assert result.format == "JPEG"
    assert result.size == (AVATAR_SIZE, AVATAR_SIZE)


def test_a_wide_picture_keeps_its_centre():
    image = PILImage.new("RGB", (300, 100), BLUE)
    image.paste(RED, (100, 0, 200, 100))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")

    result = _open(process_avatar(io.BytesIO(buffer.getvalue())))

    assert _closer_to_red(result.getpixel((AVATAR_SIZE // 2, AVATAR_SIZE // 2)))
    assert _closer_to_red(result.getpixel((5, AVATAR_SIZE // 2)))


def test_exif_orientation_is_applied_and_dropped():
    exif = PILImage.Exif()
    exif[0x0112] = 6
    buffer = io.BytesIO()
    _halves().save(buffer, format="JPEG", exif=exif)

    result = _open(process_avatar(io.BytesIO(buffer.getvalue())))

    # Rotated upright, the red left half ends up on top.
    assert _closer_to_red(result.getpixel((AVATAR_SIZE // 2, 10)))
    assert not _closer_to_red(result.getpixel((AVATAR_SIZE // 2, AVATAR_SIZE - 10)))
    assert not result.getexif()


def test_transparency_becomes_white():
    buffer = io.BytesIO()
    PILImage.new("RGBA", (50, 50), (0, 0, 0, 0)).save(buffer, format="PNG")

    result = _open(process_avatar(io.BytesIO(buffer.getvalue())))

    assert min(result.getpixel((10, 10))) > 245


def test_garbage_is_rejected():
    with pytest.raises(InvalidAvatar):
        process_avatar(io.BytesIO(b"definitely not an image"))
