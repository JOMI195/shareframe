import os
import random
import uuid
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .forms import UserChangeForm, UserCreationForm

from .choices import RANDOM_USERNAMES
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    model = User
    form = UserChangeForm
    add_form = UserCreationForm
    list_display = (
        "id",
        "email",
        "username",
        "date_joined",
        "is_staff",
        "is_active",
        "is_deleted",
    )
    list_filter = (
        "date_joined",
        "is_staff",
        "is_active",
        "is_deleted",
    )
    ordering = ("-date_joined",)
    readonly_fields = ("last_login", "date_joined", "is_deleted")

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "email",
                    "username",
                    "password",
                )
            },
        ),
        ("Deleted", {"fields": ("is_deleted",)}),
        (
            "Important dates",
            {
                "fields": (
                    "last_login",
                    "date_joined",
                )
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "username",
                    "password1",
                    "password2",
                    "is_staff",
                    "is_active",
                ),
            },
        ),
    )
    search_fields = (
        "email",
        "username",
    )

    def save_model(self, request, obj, form, change):
        if not change:
            obj.save()
        else:
            obj.save()

    def delete_model(self, request, obj, anonymize=True):
        """Handle soft deletion, with optional anonymization."""
        if anonymize:
            new_username = random.choice(RANDOM_USERNAMES)
            obj.username = new_username

        new_email = f"{uuid.uuid4()}@deleted.de"
        obj.email = new_email

        default_password = os.environ.get(
            "DJANGO_DEFAULT_USER_PASSWORT_ON_DELETION", "qJfxMgCKMO"
        )
        obj.set_password(default_password)

        obj.is_active = False
        obj.is_deleted = True
        obj.is_staff = False

        obj.is_superuser = False

        obj.save()

    def delete_queryset(self, request, queryset, anonymize=True):
        """Handle soft deletion for multiple objects, with optional anonymization."""
        for obj in queryset:
            self.delete_model(request, obj, anonymize=anonymize)

    def get_actions(self, request):
        """Remove the default delete action."""
        actions = super().get_actions(request)
        if not request.user.is_superuser:
            if "delete_selected" in actions:
                del actions["delete_selected"]
        return actions

    @admin.action(description=_("Soft delete selected users with anonymization"))
    def soft_delete_anonymized(self, request, queryset):
        """Soft delete selected users and anonymize their data."""
        self.delete_queryset(request, queryset, anonymize=True)
        self.message_user(
            request, _("Selected users have been soft deleted and anonymized.")
        )

    @admin.action(description=_("Soft delete selected users without anonymization"))
    def soft_delete_no_anonymize(self, request, queryset):
        """Soft delete selected users without anonymizing their data."""
        self.delete_queryset(request, queryset, anonymize=False)
        self.message_user(
            request, _("Selected users have been soft deleted without anonymizing.")
        )

    actions = [soft_delete_anonymized, soft_delete_no_anonymize]
