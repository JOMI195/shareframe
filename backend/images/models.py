import os
import uuid
from django.conf import settings
from django.db import models
from django.core.files.storage import default_storage


def get_image_upload_path(instance, filename):
    obfuscated_dirname = str(uuid.uuid4())
    return os.path.join("private", "images", obfuscated_dirname, filename)


class Image(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ImageField(upload_to=get_image_upload_path)
    created_at = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=254)
    size = models.PositiveBigIntegerField()

    def __str__(self):
        return self.name

    def get_actual_filename(self):
        if os.path.sep in self.image.name:
            return os.path.basename(self.image.name)
        else:
            return self.image.name

    def save(self, *args, **kwargs):
        if self.pk:
            try:
                old_instance = Image.objects.get(pk=self.pk)
                if old_instance.image != self.image:
                    old_instance.image.delete(save=False)
            except Image.DoesNotExist:
                pass

        actual_filename = self.get_actual_filename()
        self.name = actual_filename.lower()
        self.size = self.image.size
        super(Image, self).save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.image:
            image_path = self.image.path
            dir_path = os.path.dirname(image_path)
        else:
            image_path = None
            dir_path = None

        super().delete(*args, **kwargs)

        if image_path and os.path.isfile(image_path):
            default_storage.delete(image_path)

        if dir_path and os.path.exists(dir_path) and not os.listdir(dir_path):
            os.rmdir(dir_path)
