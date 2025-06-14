import os
import time
import uuid
from django.db import models

from frames.models import FrameGroup


def changelogs_markdown_upload_path(instance, filename):
    base, ext = os.path.splitext(filename)
    timestamp = int(time.time())
    new_filename = f"{base}_{timestamp}{ext}"
    return os.path.join("changelogs/content", new_filename)


def changelog_image_upload_path(instance, filename):
    base, ext = os.path.splitext(filename)
    unique_id = str(uuid.uuid4())
    new_filename = f"{unique_id}{ext}"
    return os.path.join("changelogs/images", new_filename)


class Changelog(models.Model):
    date = models.DateField()
    title = models.CharField(max_length=255)
    content_file = models.FileField(
        upload_to=changelogs_markdown_upload_path, blank=True
    )
    groups = models.ManyToManyField(
        FrameGroup,
        blank=True,
        related_name="changelogs",
    )
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return self.title

    def get_markdown_content(self):
        if self.content_file and self.content_file.storage.exists(
            self.content_file.name
        ):
            try:
                with self.content_file.open("r") as f:
                    return f.read()
            except Exception as e:
                return f"Error reading changelog file: {str(e)}"
        return ""

    def delete(self, *args, **kwargs):
        if self.content_file and self.content_file.storage.exists(
            self.content_file.name
        ):
            self.content_file.delete(save=False)
        super().delete(*args, **kwargs)

    def save(self, *args, **kwargs):
        try:
            old = Changelog.objects.get(pk=self.pk)
        except Changelog.DoesNotExist:
            old = None

        # If updating and the file has changed, delete the old file
        if old and old.content_file != self.content_file:
            if old.content_file and old.content_file.storage.exists(
                old.content_file.name
            ):
                old.content_file.delete(save=False)

        super().save(*args, **kwargs)


class ChangelogImage(models.Model):
    changelog = models.ForeignKey(
        "Changelog", related_name="images", on_delete=models.CASCADE
    )
    tag = models.CharField(max_length=100)
    image = models.ImageField(upload_to=changelog_image_upload_path)
    description = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["changelog", "tag"], name="unique_tag_per_changelog"
            )
        ]

    def __str__(self):
        return f"{self.tag} for {self.changelog.title}"

    def delete(self, *args, **kwargs):
        if self.image and self.image.storage.exists(self.image.name):
            self.image.delete(save=False)
        super().delete(*args, **kwargs)

    def save(self, *args, **kwargs):
        try:
            old = ChangelogImage.objects.get(pk=self.pk)
        except ChangelogImage.DoesNotExist:
            old = None

        if old and old.image != self.image:
            if old.image and old.image.storage.exists(old.image.name):
                old.image.delete(save=False)

        super().save(*args, **kwargs)
