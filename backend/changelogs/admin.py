from django.contrib import admin, messages
from django.db import transaction
from django.utils.html import format_html

from notifications.channels.email import preview_address

from .forms import ChangelogAdminForm
from .models import Changelog, ChangelogImage
from .publish import notify_when_published
from .tasks import send_changelog_test


class ChangelogImageInline(admin.StackedInline):
    model = ChangelogImage
    extra = 0
    fields = ("tag", "description", "image", "uploaded_at")
    readonly_fields = ("uploaded_at",)


@admin.register(Changelog)
class ChangelogAdmin(admin.ModelAdmin):
    form = ChangelogAdminForm

    list_display = (
        "id",
        "date",
        "title",
        "is_published",
        "updated_at",
        "notified_at",
        "group_list",
    )
    list_filter = ("date", "is_published", "groups")
    search_fields = ("title",)
    readonly_fields = ("created_at", "updated_at", "notified_at")
    filter_horizontal = ("groups",)
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "date",
                    "title",
                    "is_published",
                    "content_file",
                    "content_text",
                )
            },
        ),
        (
            "Groups",
            {
                "fields": ("groups",),
            },
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at", "notified_at")},
        ),
    )
    inlines = [ChangelogImageInline]
    actions = ["send_test_to_me"]

    def group_list(self, obj):
        groups = obj.groups.all()
        if not groups:
            return format_html('<span style="color: red;">{}</span>', "No groups")
        group_names = [group.name for group in groups]
        return format_html(
            '<span style="font-size: 12px;">{}</span>', ", ".join(group_names)
        )

    group_list.short_description = "Groups"

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        changelog = form.instance
        # After commit: groups and images are saved by then.
        transaction.on_commit(lambda: self._notify_when_published(request, changelog))

    def _notify_when_published(self, request, changelog):
        changelog.refresh_from_db()
        reason = notify_when_published(changelog)
        if reason is None:
            self.message_user(
                request,
                f'"{changelog}" published: notifications queued for '
                f"{changelog.recipients().count()} recipients.",
                messages.SUCCESS,
            )
        elif reason != "not due":
            self.message_user(
                request,
                f'"{changelog}" published but not sent: {reason}. '
                "Save it again once this is fixed.",
                messages.WARNING,
            )

    @admin.action(description="Send test to me (mail and push)")
    def send_test_to_me(self, request, queryset):
        for changelog in queryset:
            send_changelog_test.delay(changelog.id, request.user.id)
        devices = request.user.account.push_subscriptions.count()
        self.message_user(
            request,
            f"Test queued: mail to {preview_address(request.user)}, "
            f"push to {devices} subscribed device{'s' if devices != 1 else ''}.",
        )
