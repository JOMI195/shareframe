from django.contrib import admin
from .models import SentImage
from django.utils.html import format_html


@admin.register(SentImage)
class SentImageAdmin(admin.ModelAdmin):
    list_display = ("id", "sender", "reciever", "sent_at")
    list_filter = ("sent_at",)
    search_fields = ("sender__username", "reciever__username")
    ordering = ("-sent_at",)
    readonly_fields = ("sender", "reciever", "sent_at", "image_display")

    fieldsets = (
        (
            None,
            {
                "fields": ("sender", "reciever", "image_display"),
            },
        ),
        (
            "Timestamps",
            {
                "fields": ("sent_at",),
            },
        ),
    )

    def image_display(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="200" height="200" />', obj.image.url
            )
        return "Something went wrong - no picture"

    image_display.short_description = "Image preview"
