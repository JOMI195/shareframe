from django.contrib import admin
from django.utils.html import format_html

from .models import Changelog, ChangelogImage
from .forms import ChangelogAdminForm


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
        "group_list",
    )
    list_filter = ("date", "is_published", "groups")
    search_fields = ("title",)
    readonly_fields = ("created_at", "updated_at")
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
            {"fields": ("created_at", "updated_at")},
        ),
    )
    inlines = [ChangelogImageInline]

    def group_list(self, obj):
        groups = obj.groups.all()
        if not groups:
            return format_html('<span style="color: red;">No groups</span>')
        group_names = [group.name for group in groups]
        return format_html(
            '<span style="font-size: 12px;">{}</span>', ", ".join(group_names)
        )

    group_list.short_description = "Groups"
