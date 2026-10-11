from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from utils.admin import confirm_page

from .avatars import clear_avatar
from .models import Account, NotificationKindPreference, NotificationPreference


class NotificationKindPreferenceInline(admin.TabularInline):
    model = NotificationKindPreference
    extra = 0


class NotificationPreferenceInline(admin.TabularInline):
    model = NotificationPreference
    extra = 0


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    model = Account
    inlines = (NotificationKindPreferenceInline, NotificationPreferenceInline)
    list_display = ("get_user_id", "get_user_email", "friendship_user_searchable")
    list_filter = ("friendship_user_searchable",)
    ordering = ("-user__id",)
    readonly_fields = ("avatar",)
    actions = ["remove_avatar"]

    @admin.action(description=_("Remove avatar of selected accounts"))
    def remove_avatar(self, request, queryset):
        if "apply" not in request.POST:
            return confirm_page(
                self,
                request,
                queryset,
                "remove_avatar",
                _("Remove avatar"),
                _("Their profile picture is deleted. This cannot be undone."),
            )
        for account in queryset:
            clear_avatar(account)
        self.message_user(request, _("Avatars removed."))

    def get_user_id(self, obj):
        return obj.user.id

    get_user_id.short_description = "user_core-id"

    def get_user_email(self, obj):
        return obj.user.email

    get_user_email.short_description = "user_core-email"
