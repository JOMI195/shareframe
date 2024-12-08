from django.contrib import admin
from .models import Account


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    model = Account
    list_display = ("get_user_id", "get_user_email", "friendship_user_searchable")
    list_filter = ("friendship_user_searchable",)
    ordering = ("-user__id",)

    def get_user_id(self, obj):
        return obj.user.id

    get_user_id.short_description = "user_core-id"

    def get_user_email(self, obj):
        return obj.user.email

    get_user_email.short_description = "user_core-email"
