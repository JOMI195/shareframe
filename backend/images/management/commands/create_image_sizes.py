from django.core.management.base import BaseCommand
from images.models import ImageSize


IMAGE_SIZES = [
    {"name": "large", "width": 1600, "height": None, "quality": 90},
    {"name": "medium", "width": 800, "height": None, "quality": 85},
    {"name": "thumbnail", "width": 350, "height": None, "quality": 85},
]


class Command(BaseCommand):
    help = "Create default image sizes (large, medium, thumbnail)."

    def handle(self, *args, **kwargs):
        for size_data in IMAGE_SIZES:
            size, created = ImageSize.objects.update_or_create(
                name=size_data["name"],
                defaults={
                    "width": size_data["width"],
                    "height": size_data["height"],
                    "quality": size_data["quality"],
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created: {size}"))
            else:
                self.stdout.write(f"Updated: {size}")

        self.stdout.write(self.style.SUCCESS("Done."))
