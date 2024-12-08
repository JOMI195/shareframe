from django.conf import settings
from django.db import models


class Account(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        primary_key=True,
        related_name="account",
        on_delete=models.CASCADE,
    )

    friendship_user_searchable = models.BooleanField(default=True)

    def __str__(self):
        return self.user.email
