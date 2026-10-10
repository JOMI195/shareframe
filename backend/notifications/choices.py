from django.db import models


class NotificationKind(models.TextChoices):
    INACTIVITY_REMINDER = "inactivity_reminder", "Inactivity reminder"
    CHANGELOG = "changelog", "Changelog"


class NotificationChannel(models.TextChoices):
    PUSH = "push", "Push"
    EMAIL = "email", "Email"
