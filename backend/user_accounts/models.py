import uuid
from django.db import models
from django.conf import settings
from django.db import models


class AccountManager(models.Manager):
    def create_account(self, user, **extra_fields):
        while True:
            search_code = str(uuid.uuid4())[:8].upper()

            if not self.model.objects.filter(
                friendship_user_search_code=search_code
            ).exists():
                break

        account = self.model(
            user=user, friendship_user_search_code=search_code, **extra_fields
        )
        account.save(using=self._db)
        return account


class Account(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        primary_key=True,
        related_name="account",
        on_delete=models.CASCADE,
    )
    friendship_user_searchable = models.BooleanField(default=True)
    friendship_user_search_code = models.CharField(max_length=100, unique=True)

    objects = AccountManager()

    def __str__(self):
        return self.user.email
