import io

from django.core.files.base import ContentFile
from django.db import transaction
from PIL import Image as PILImage
from PIL import ImageOps

AVATAR_SIZE = 256
AVATAR_QUALITY = 85


class InvalidAvatar(ValueError):
    pass


def process_avatar(file):
    try:
        with PILImage.open(file) as probe:
            probe.verify()
        file.seek(0)
        with PILImage.open(file) as source:
            image = ImageOps.exif_transpose(source)
            image = _flatten(image)
            image = ImageOps.fit(
                image, (AVATAR_SIZE, AVATAR_SIZE), PILImage.Resampling.LANCZOS
            )
    except (OSError, SyntaxError, PILImage.DecompressionBombError) as e:
        raise InvalidAvatar(str(e)) from e

    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=AVATAR_QUALITY)
    return ContentFile(buffer.getvalue())


def _flatten(image):
    if image.mode in ("RGBA", "LA") or "transparency" in image.info:
        rgba = image.convert("RGBA")
        background = PILImage.new("RGB", rgba.size, (255, 255, 255))
        background.paste(rgba, mask=rgba.getchannel("A"))
        return background
    return image.convert("RGB")


def set_avatar(account, file):
    content = process_avatar(file)
    old_name = account.avatar.name
    account.avatar.save("avatar.jpg", content, save=False)
    account.save(update_fields=["avatar"])
    _delete_on_commit(account, old_name)


def clear_avatar(account):
    old_name = account.avatar.name
    if not old_name:
        return
    account.avatar = ""
    account.save(update_fields=["avatar"])
    _delete_on_commit(account, old_name)


def _delete_on_commit(account, name):
    if name:
        storage = account.avatar.storage
        transaction.on_commit(lambda: storage.delete(name))


def avatar_url(user):
    account = getattr(user, "account", None)
    if account is None or not account.avatar:
        return None
    return account.avatar.url
