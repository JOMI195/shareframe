from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models, transaction
from django.utils import timezone

from user_accounts.avatars import clear_avatar
from user_accounts.models import Account

from .validation import is_username_allowed


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

        account = Account.objects.create_account(user=user)
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
    username = models.CharField(max_length=25, unique=True)
    date_joined = models.DateTimeField(default=timezone.now)

    is_active = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        """Return string representation of the object."""
        return self.email

    class Meta:
        app_label = "user_core"
        db_table = "user"

    def get_short_name(self):
        """Return the short name for the user."""
        return self.email

    def get_full_name(self):
        """Return the full name for the user."""
        return self.email

    def has_perm(self, perm, obj=None):
        """Check if the user have a specific permission."""
        # Simplest possible answer: Yes, always
        return self.is_admin

    def has_module_perms(self, app_label):
        """Check if the user have permissions to view the app `app_label."""
        # Simplest possible answer: Yes, always
        return True

    @transaction.atomic()
    def delete(self, *args, **kwargs):
        """Remove the user with everything they own, files included."""
        from sent_images.delivery import clear_from_frames
        from sent_images.models import SentImage

        clear_from_frames(
            SentImage.objects.sent().filter(
                models.Q(sender=self) | models.Q(reciever=self)
            )
        )

        # Image.delete() removes the files; a cascade would not.
        for image in self.images.all():
            image.delete()

        if hasattr(self, "account"):
            clear_avatar(self.account)

        return super().delete(*args, **kwargs)
