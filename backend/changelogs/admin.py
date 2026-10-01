from django.conf import settings
from django.contrib import admin, messages
from django.contrib.admin import helpers
from django.template.response import TemplateResponse
from django.utils import timezone
from django.utils.html import format_html

from .forms import ChangelogAdminForm
from .models import Changelog, ChangelogImage
from .tasks import send_changelog_email


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
        "email_sent_at",
        "group_list",
    )
    list_filter = ("date", "is_published", "groups")
    search_fields = ("title",)
    readonly_fields = ("created_at", "updated_at", "email_sent_at")
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
            {"fields": ("created_at", "updated_at", "email_sent_at")},
        ),
    )
    inlines = [ChangelogImageInline]
    actions = ["send_test_email", "send_email_to_group_members"]

    def group_list(self, obj):
        groups = obj.groups.all()
        if not groups:
            return format_html('<span style="color: red;">{}</span>', "No groups")
        group_names = [group.name for group in groups]
        return format_html(
            '<span style="font-size: 12px;">{}</span>', ", ".join(group_names)
        )

    group_list.short_description = "Groups"

    @admin.action(description="Send test email to me")
    def send_test_email(self, request, queryset):
        to_email = (
            settings.ADMIN_NOTIFICATION_EMAIL
            if getattr(request.user, "is_admin", False)
            else request.user.email
        )
        for changelog in queryset:
            send_changelog_email.delay(changelog.id, [to_email])
        self.message_user(request, f"Test email queued for {to_email}.")

    @admin.action(description="Send email to group members")
    def send_email_to_group_members(self, request, queryset):
        sendable, skipped = [], []
        for changelog in queryset:
            count = changelog.recipients().count()
            if changelog.email_sent_at:
                skipped.append(
                    (
                        changelog,
                        f"already sent on {changelog.email_sent_at:%d.%m.%Y %H:%M}",
                    )
                )
            elif not changelog.is_published:
                skipped.append((changelog, "not published"))
            elif not count:
                skipped.append((changelog, "no recipients"))
            else:
                sendable.append((changelog, count))

        if sendable and "apply" not in request.POST:
            return TemplateResponse(
                request,
                "admin/changelogs/confirm_send_email.html",
                {
                    **self.admin_site.each_context(request),
                    "title": "Send changelog email",
                    "opts": self.model._meta,
                    "sendable": sendable,
                    "skipped": skipped,
                    "action_checkbox_name": helpers.ACTION_CHECKBOX_NAME,
                },
            )

        for changelog, reason in skipped:
            self.message_user(
                request, f'"{changelog}" skipped: {reason}.', messages.WARNING
            )

        for changelog, _ in sendable:
            emails = list(changelog.recipients().values_list("email", flat=True))
            send_changelog_email.delay(changelog.id, emails)
            changelog.email_sent_at = timezone.now()
            changelog.save(update_fields=["email_sent_at"])
            self.message_user(
                request,
                f'"{changelog}" queued for {len(emails)} recipients.',
                messages.SUCCESS,
            )
