import os
import uuid
from django.db import models
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
import semver

from frames.models import FrameGroup


def release_file_upload_path(instance, filename):
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    return os.path.join("frame-updates", unique_filename)


class Release(models.Model):
    class UpdateCriticality(models.TextChoices):
        CRITICAL = "Critical", "Critical"
        IMPORTANT = "Important", "Important"
        MINOR = "Minor", "Minor"
        PATCH = "Patch", "Patch"

    version = models.CharField(
        max_length=20,
        unique=True,
        validators=[
            RegexValidator(
                regex=r"^(\d+\.)?(\d+\.)?(\*|\d+)$",
                message="Version must be in semantic versioning format (e.g., 1.0.0)",
            )
        ],
    )
    groups = models.ManyToManyField(
        FrameGroup,
        blank=True,
        related_name="releases",
    )
    release_date = models.DateTimeField(auto_now_add=True)
    file = models.FileField(upload_to=release_file_upload_path)
    checksum = models.CharField(max_length=64)
    is_active = models.BooleanField(default=True)
    release_notes = models.TextField(blank=True)
    criticality = models.CharField(
        max_length=10,
        choices=UpdateCriticality.choices,
        default=UpdateCriticality.PATCH,
    )

    class Meta:
        ordering = ["-release_date"]

    def clean(self):
        try:
            semver.VersionInfo.parse(self.version)
        except ValueError:
            raise ValidationError({"version": "Invalid semantic version format"})

    def save(self, *args, **kwargs):
        try:
            old = Release.objects.get(pk=self.pk)
        except Release.DoesNotExist:
            old = None

        # If updating and the file has changed, delete the old file
        if old and old.file != self.file:
            if old.file and old.file.storage.exists(old.file.name):
                old.file.delete(save=False)

        self.full_clean()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.file and self.file.storage.exists(self.file.name):
            self.file.delete(save=False)
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"ShareFrame v{self.version} ({self.criticality})"
