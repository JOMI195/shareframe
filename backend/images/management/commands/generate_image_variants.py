from django.core.management.base import BaseCommand
from images.models import Image, ImageSize


class Command(BaseCommand):
    help = "Generate sized images for all Image objects."

    def handle(self, *args, **kwargs):
        images = Image.objects.all()
        total = images.count()
        self.stdout.write(f"Found {total} images.")

        if total == 0:
            self.stdout.write("No images need to be processed.")
            return

        # Get all available image sizes
        image_sizes = ImageSize.objects.all()
        if not image_sizes.exists():
            self.stdout.write("No image sizes defined. Please create some first.")
            return

        for index, image in enumerate(images, start=1):
            self.stdout.write(f"Processing {index}/{total} - Image ID: {image.id}")
            try:
                # Delete existing variants and their files
                for variant in image.variants.all():
                    if variant.file:
                        # Delete the actual file
                        name = variant.file.name
                        variant.file.delete(save=False)
                        self.stdout.write(f"  Deleted variant file: {name}")
                    # Delete the variant record
                    variant.delete()

                # Generate all size variants
                image.generate_sized_images()

                # Save image to update metadata
                image.save(update_fields=["width", "height", "format"])

                # Log the variants that were created
                variant_names = [v.image_size.name for v in image.variants.all()]
                self.stdout.write(f"Created variants: {', '.join(variant_names)}")

                self.stdout.write(f"Successfully processed Image ID: {image.id}")
            except Exception as e:
                self.stderr.write(f"Failed to process Image ID: {image.id} - {e}")

        self.stdout.write("All images have been processed.")
