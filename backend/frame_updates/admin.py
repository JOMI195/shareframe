from django.contrib import admin
from django.utils.html import format_html
from .models import Release


@admin.register(Release)
class ReleaseAdmin(admin.ModelAdmin):
    list_display = (
        "version",
        "criticality",
        "release_date",
        "is_active",
        "group_list",
    )
    list_filter = (
        "is_active",
        "criticality",
        "groups",
    )
    search_fields = ("version",)
    ordering = ("-release_date",)
    readonly_fields = ("release_date",)
    filter_horizontal = ("groups",)
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "version",
                    "criticality",
                    "is_active",
                    "file",
                    "checksum",
                    "release_notes",
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
            {"fields": ("release_date",)},
        ),
    )

    def group_list(self, obj):
        groups = obj.groups.all()
        if not groups:
            return format_html('<span style="color: red;">No groups</span>')

        group_names = [group.name for group in groups]
        return format_html(
            '<span style="font-size: 12px;">{}</span>', ", ".join(group_names)
        )

    group_list.short_description = "Groups"
