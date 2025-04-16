import os
from django.core.management.base import BaseCommand
from images.models import Image


def get_actual_image_filename(image: Image):
    if os.path.sep in image.image.name:
        return os.path.basename(image.image.name)
    else:
        return image.image.name


class Command(BaseCommand):
    help = "Update names for all Image objects."

    def handle(self, *args, **kwargs):
        images = Image.objects.all()
        total = images.count()
        self.stdout.write(f"Found {total} images.")

        if total == 0:
            self.stdout.write("No images need to be processed.")
            return

        for index, image in enumerate(images, start=1):
            self.stdout.write(f"Processing {index}/{total} - Image ID: {image.id}")
            try:
                image.display_name = f"image_{image.id}"
                image.name = get_actual_image_filename(image)

                image.save(update_fields=["display_name"])

                self.stdout.write(f"Successfully processed Image ID: {image.id}")
            except Exception as e:
                self.stderr.write(f"Failed to process Image ID: {image.id} - {e}")

        self.stdout.write("All images have been processed.")
