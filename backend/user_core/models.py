import os
import random
import uuid
from django.utils import timezone
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models, transaction
from .validation import is_username_allowed
from .choices import RANDOM_USERNAMES
from user_accounts.models import Account


class CustomUserManager(BaseUserManager):
    """Custome user manager."""

    @transaction.atomic()
    def create_user(self, email, username, password=None, **extra_kwargs):
        """Create and saves a User with the given email, username and password."""
        if not email:
            raise ValueError("Users must have an email address")

        if not is_username_allowed(username):
            raise ValueError("The username contains sensitive or problematic terms.")

        user = self.model(
            email=self.normalize_email(email), username=username, **extra_kwargs
        )

        user.set_password(password)
        user.save(using=self._db)

        account = Account.objects.create(user=user)
        account.save()

        return user

    @transaction.atomic()
    def create_superuser(self, email, username, password=None, **extra_kwargs):
        """Create and saves a superuser with the given email,username and password."""

        user = self.create_user(
            email, password=password, username=username, **extra_kwargs
        )
        user.is_staff = True
        user.is_active = True
        user.is_admin = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model representing user in the system."""

    email = models.EmailField(
        verbose_name="Email",
        max_length=255,
        unique=True,
    )
    username = models.CharField(max_length=25, unique=False)
    date_joined = models.DateTimeField(default=timezone.now)

    is_active = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        """Return string representation of the object."""
        return self.email

    class Meta:
        app_label = "user_core"
        db_table = "user"

    def has_perm(self, perm, obj=None):
        """Check if the user have a specific permission."""
        # Simplest possible answer: Yes, always
        return self.is_admin

    def has_module_perms(self, app_label):
        """Check if the user have permissions to view the app `app_label."""
        # Simplest possible answer: Yes, always
        return True

    def delete(self, anonymize=True):
        """Custom delete method to handle soft deletion and updates."""

        if anonymize:
            new_username = random.choice(RANDOM_USERNAMES)
            self.username = new_username

        new_email = f"{uuid.uuid4()}@deleted.de"
        self.email = new_email

        default_password = os.environ.get(
            "DJANGO_DEFAULT_USER_PASSWORT_ON_DELETION", "qJfxMgCKMO"
        )
        self.set_password(default_password)

        self.is_active = False
        self.is_staff = False
        self.is_superuser = False

        self.is_deleted = True

        if hasattr(self, "account"):
            self.account.friendship_user_searchable = False
            self.account.save()

        self.save()
