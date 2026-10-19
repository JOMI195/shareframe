from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from user_accounts.models import Account

from .forms import UserChangeForm, UserCreationForm
from .models import User


class AccountInline(admin.TabularInline):
    model = Account
    list_display = ["friendship_user_searchable", "friendship_user_search_code"]
    readonly_fields = ("friendship_user_search_code", "avatar")
    extra = 0
    max_num = 1


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    model = User
    form = UserChangeForm
    add_form = UserCreationForm
    inlines = (AccountInline,)
    list_display = (
        "id",
        "email",
        "username",
        "date_joined",
        "is_staff",
        "is_active",
    )
    list_filter = (
        "date_joined",
        "is_staff",
        "is_active",
    )
    ordering = ("-date_joined",)
    readonly_fields = ("last_login", "date_joined")

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
            Account.objects.create_account(user=obj)
        else:
            obj.save()

    def delete_queryset(self, request, queryset):
        # The bulk delete would skip User.delete().
        for obj in queryset:
            obj.delete()

    def get_actions(self, request):
        """Remove the default delete action."""
        actions = super().get_actions(request)
        if not request.user.is_superuser:
            if "delete_selected" in actions:
                del actions["delete_selected"]
        return actions
