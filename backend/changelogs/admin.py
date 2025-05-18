from django.contrib import admin
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
    )
    list_filter = ("date", "is_published")
    search_fields = ("title",)
    readonly_fields = ("created_at", "updated_at")
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
            "Timestamps",
            {"fields": ("created_at", "updated_at")},
        ),
    )
    inlines = [ChangelogImageInline]
