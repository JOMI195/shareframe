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
