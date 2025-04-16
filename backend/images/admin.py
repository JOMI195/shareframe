from django.contrib import admin
from .models import Image, ImageSize, ImageVariant


class ImageVariantInline(admin.TabularInline):
    model = ImageVariant
    extra = 0
    readonly_fields = ("file",)
    fields = ("image_size", "file")


@admin.register(ImageSize)
class ImageSizeAdmin(admin.ModelAdmin):
    list_display = ("name", "width", "height", "quality")
    list_filter = ("name",)
    search_fields = ("name",)
    ordering = ("name",)


@admin.register(Image)
class ImagesAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "user",
        "format",
        "dimensions",
        "size_display",
        "created_at",
    )
    list_filter = ("created_at", "format", "markedAsDeleted")
    search_fields = ("name", "user__username", "user__email")
    ordering = ("-created_at",)
    readonly_fields = (
        "created_at",
        "name",
        "display_name",
        "size",
        "width",
        "height",
        "format",
    )
    inlines = [ImageVariantInline]
    fieldsets = (
        (
            None,
            {"fields": ("user", "name", "display_name", "image", "markedAsDeleted")},
        ),
        (
            "Image Properties",
            {"fields": ("format", "width", "height", "size")},
        ),
        (
            "Timestamps",
            {"fields": ("created_at",)},
        ),
    )

    def dimensions(self, obj):
        """Display image dimensions"""
        if obj.width and obj.height:
            return f"{obj.width} × {obj.height}"
        return "Unknown"

    dimensions.short_description = "Dimensions"

    def size_display(self, obj):
        """Display file size in human-readable format"""
        # Convert bytes to appropriate unit
        size_bytes = obj.size
        for unit in ["B", "KB", "MB", "GB"]:
            if size_bytes < 1024.0 or unit == "GB":
                break
            size_bytes /= 1024.0
        return f"{size_bytes:.2f} {unit}"

    size_display.short_description = "Size"
