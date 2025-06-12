from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Case, When
from django.contrib.admin.views.main import ChangeList
from django.http import HttpRequest
from .models import Release
import semver


class SemverChangeList(ChangeList):
    def get_queryset(self, request: HttpRequest):
        qs = super().get_queryset(request)

        sorted_qs = sorted(
            qs,
            key=lambda r: semver.VersionInfo.parse(r.version),
            reverse=True,
        )

        sorted_ids = [r.pk for r in sorted_qs]

        preserved = Case(*[When(pk=pk, then=pos) for pos, pk in enumerate(sorted_ids)])

        return qs.filter(pk__in=sorted_ids).order_by(preserved)


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
    readonly_fields = ("release_date",)
    filter_horizontal = ("groups",)
    ordering = ()  # Leave empty since we override get_queryset

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

    def get_changelist(self, request, **kwargs):
        return SemverChangeList

    def group_list(self, obj):
        groups = obj.groups.all()
        if not groups:
            return format_html('<span style="color: red;">No groups</span>')
        group_names = [group.name for group in groups]
        return format_html(
            '<span style="font-size: 12px;">{}</span>', ", ".join(group_names)
        )

    group_list.short_description = "Groups"
