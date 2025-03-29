from django.db import models
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
import semver


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
    release_date = models.DateTimeField(auto_now_add=True)
    download_url = models.URLField(max_length=500)
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
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"ShareFrame v{self.version} ({self.criticality})"
