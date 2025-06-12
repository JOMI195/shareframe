from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Case, When
from .models import Release
import semver


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

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Create a sorted list of IDs based on semantic versioning
        sorted_ids = sorted(
            qs,
            key=lambda r: semver.VersionInfo.parse(r.version),
            reverse=True,
        )
        id_order = [r.pk for r in sorted_ids]

        if not id_order:
            return qs.none()

        # Use a CASE WHEN to preserve order at the DB level
        preserved_order = Case(
            *[When(pk=pk, then=pos) for pos, pk in enumerate(id_order)]
        )
        return qs.filter(pk__in=id_order).order_by(preserved_order)

    def group_list(self, obj):
        groups = obj.groups.all()
        if not groups:
            return format_html('<span style="color: red;">No groups</span>')
        group_names = [group.name for group in groups]
        return format_html(
            '<span style="font-size: 12px;">{}</span>', ", ".join(group_names)
        )

    group_list.short_description = "Groups"
