from django.contrib import admin, messages
from django.contrib.admin import helpers
from django.template.response import TemplateResponse
from django.utils.html import format_html

from .forms import ChangelogAdminForm
from .models import Changelog, ChangelogImage
from .publish import notify_group_members, skip_reason
from .tasks import notify_changelog_test


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
    actions = ["notify_group_members", "notify_me_as_test"]

    def group_list(self, obj):
        groups = obj.groups.all()
        if not groups:
            return format_html('<span style="color: red;">{}</span>', "No groups")
        group_names = [group.name for group in groups]
        return format_html(
            '<span style="font-size: 12px;">{}</span>', ", ".join(group_names)
        )

    group_list.short_description = "Groups"

    @admin.action(description="Notify group members")
    def notify_group_members(self, request, queryset):
        notifiable, skipped = [], []
        for changelog in queryset:
            reason = skip_reason(changelog)
            if reason:
                skipped.append((changelog, reason))
            else:
                notifiable.append((changelog, changelog.recipients().count()))

        if notifiable and "apply" not in request.POST:
            return TemplateResponse(
                request,
                "admin/changelogs/confirm_notify.html",
                {
                    **self.admin_site.each_context(request),
                    "title": "Notify group members",
                    "opts": self.model._meta,
                    "notifiable": notifiable,
                    "skipped": skipped,
                    "action_checkbox_name": helpers.ACTION_CHECKBOX_NAME,
                },
            )

        for changelog, reason in skipped:
            self.message_user(
                request, f'"{changelog}" skipped: {reason}.', messages.WARNING
            )

        for changelog, count in notifiable:
            if notify_group_members(changelog):
                self.message_user(
                    request,
                    f'"{changelog}": notifications queued for {count} recipients.',
                    messages.SUCCESS,
                )

    @admin.action(description="Notify me (test)")
    def notify_me_as_test(self, request, queryset):
        for changelog in queryset:
            notify_changelog_test.delay(changelog.id, request.user.id)
        self.message_user(request, "Test notification queued for you.")
