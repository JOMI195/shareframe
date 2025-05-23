from django.contrib import admin
from .models import Release


@admin.register(Release)
class ReleaseAdmin(admin.ModelAdmin):
    list_display = (
        "version",
        "criticality",
        "release_date",
        "is_active",
    )
    list_filter = (
        "is_active",
        "criticality",
    )
    search_fields = ("version",)
    ordering = ("-release_date",)
    readonly_fields = ("release_date",)
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
            "Timestamps",
            {"fields": ("release_date",)},
        ),
    )
