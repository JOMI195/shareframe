from django.contrib import admin
from .models import Image
from django.utils.html import format_html
from django.contrib import messages
from django.utils.translation import gettext_lazy as _


@admin.register(Image)
class ImagesAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "created_at")
    list_filter = ("created_at",)
    ordering = ("-created_at",)

    def image_display(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="200" height="200" />', obj.image.url
            )
        return "Something went wrong - no picture"

    image_display.short_description = "Image preview"

    readonly_fields = (
        "image_display",
        "created_at",
    )
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "user",
                    "created_at",
                    "image_display",
                )
            },
        ),
    )
