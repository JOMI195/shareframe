import os
import uuid
import logging
from io import BytesIO
from django.conf import settings
from django.db import models
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from PIL import Image as PILImage

logger = logging.getLogger("images")


def get_image_upload_path(instance, filename, size_suffix=""):
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    unique_id = str(uuid.uuid4())

    if size_suffix:
        unique_filename = (
            f"{unique_id}_{size_suffix}.{ext}" if ext else f"{unique_id}_{size_suffix}"
        )
    else:
        unique_filename = f"{unique_id}.{ext}" if ext else unique_id

    return os.path.join("private", "images", unique_filename)


def get_original_upload_path(instance, filename):
    return get_image_upload_path(instance, filename)


def get_variant_upload_path(instance, filename):
    """Upload path for image variants"""
    parent_image = instance.parent_image
    size_name = instance.image_size.name
    return get_image_upload_path(parent_image, filename, size_name)


class ImageSize(models.Model):
    name = models.CharField(max_length=50)  # e.g., "thumbnail", "medium", "large"
    width = models.PositiveIntegerField()
    height = models.PositiveIntegerField(
        null=True, blank=True
    )  # null means maintain aspect ratio
    quality = models.PositiveIntegerField(default=85)  # JPEG quality

    def __str__(self):
        if self.height:
            return f"{self.name} ({self.width}x{self.height})"
        return f"{self.name} (width: {self.width})"


class ImageVariant(models.Model):
    """Model to store various sized versions of an image"""

    image_size = models.ForeignKey(ImageSize, on_delete=models.CASCADE)
    parent_image = models.ForeignKey(
        "Image", on_delete=models.CASCADE, related_name="variants"
    )
    file = models.ImageField(upload_to=get_variant_upload_path)

    class Meta:
        unique_together = ("image_size", "parent_image")

    def __str__(self):
        return f"{self.parent_image.name} - {self.image_size.name}"


class Image(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="images",
    )
    markedAsDeleted = models.BooleanField(default=False)

    image = models.ImageField(upload_to=get_original_upload_path)

    created_at = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=254)
    display_name = models.CharField(max_length=254, blank=True)
    size = models.PositiveBigIntegerField()  # Size of original image

    # Store format information for easier resizing
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    format = models.CharField(max_length=10, blank=True)  # e.g., "JPEG", "PNG"

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        if self.display_name:
            return self.display_name
        return self.name

    def get_actual_filename(self):
        if os.path.sep in self.image.name:
            return os.path.basename(self.image.name)
        else:
            return self.image.name

    def generate_sized_images(self):
        """Generate different sized versions of the image based on ImageSize models"""
        if not self.image:
            logger.warning(
                f"Cannot generate variants for image ID {self.id} - original image is missing"
            )
            return

        logger.info(f"Generating image variants for image ID {self.id}")
        # Open the original image
        img = PILImage.open(self.image)

        # Store original image dimensions and format
        self.width = img.width
        self.height = img.height
        self.format = img.format

        # Get all available image sizes from the database
        image_sizes = ImageSize.objects.all()

        # Generate each size
        for size in image_sizes:
            self._create_resized_image(
                img, size.name, size.width, size.height, size.quality, size
            )
        logger.info(
            f"Successfully generated {image_sizes.count()} image variants for image ID {self.id}"
        )

    def _create_resized_image(
        self, img, size_name, width, height, quality=85, size_model=None
    ):
        """Create a resized version of the image"""
        if not width:
            return

        # Make a copy to avoid modifying the original
        img_copy = img.copy()

        # Convert to RGB if necessary (for proper JPEG saving)
        if img_copy.mode not in ("RGB", "RGBA"):
            img_copy = img_copy.convert("RGB")

        # Calculate new dimensions maintaining aspect ratio if height is None
        if height is None:
            wpercent = width / float(img_copy.width)
            height = int((float(img_copy.height) * float(wpercent)))

        # Resize the image
        img_copy = img_copy.resize((width, height), PILImage.LANCZOS)

        # Save to memory buffer
        output = BytesIO()
        img_format = "JPEG" if img.format == "JPEG" else "PNG"
        if img_format == "JPEG":
            img_copy.save(output, format=img_format, quality=quality, optimize=True)
        else:
            img_copy.save(output, format=img_format, optimize=True)
        output.seek(0)

        # Generate filename for the resized image
        original_filename = self.get_actual_filename()

        # Create or update the ImageVariant instance
        if size_model:
            variant, created = ImageVariant.objects.get_or_create(
                parent_image=self, image_size=size_model
            )

            # If the variant already exists, delete the old file
            if not created and variant.file:
                variant.file.delete(save=False)

            # Save the new file
            variant.file.save(
                original_filename,
                ContentFile(output.read()),
                save=True,
            )

        output.close()

    def get_variant(self, size_name):
        """Get a specific size variant of the image"""
        try:
            variant = self.variants.get(image_size__name=size_name)
            return variant.file
        except ImageVariant.DoesNotExist:
            return None

    def save(self, *args, **kwargs):
        update_fields_only = kwargs.pop("update_fields_only", False)

        if update_fields_only:
            logger.debug(f"Limited field update in save for Image with ID {self.pk}")
            super().save(*args, **kwargs)
            return

        is_new = not self.pk

        if is_new:
            logger.info("Creating new image")
        else:
            logger.info(f"Updating existing image ID {self.pk}")

        if self.pk:
            try:
                old_instance = Image.objects.get(pk=self.pk)
                if old_instance.image != self.image:
                    logger.info(
                        f"Image file changed for ID {self.pk}, removing old files"
                    )
                    # Delete old image file
                    old_instance.image.delete(save=False)

                    # Delete all old variants
                    for variant in old_instance.variants.all():
                        variant.file.delete(save=False)
                        variant.delete()
            except Image.DoesNotExist:
                pass

        # set image size
        self.size = self.image.size

        # First save to ensure we have an ID
        super(Image, self).save(*args, **kwargs)

        self.name = self.get_actual_filename()
        if not self.display_name:
            self.display_name = f"image_{self.id}"
        super(Image, self).save(update_fields=["name", "display_name"])

        # Generate variants after the original is saved
        if is_new or not self.variants.exists():
            self.generate_sized_images()
            # Save again to store updated metadata
            super(Image, self).save(update_fields=["width", "height", "format"])

        logger.info(f"Image ID {self.id} saved successfully")

    def delete(self, *args, **kwargs):
        logger.info(f"Permanently deleting image ID {self.id}")

        # Delete all image files
        image_paths = []
        dirs_to_check = set()

        if self.image:
            image_paths.append(self.image.path)
            dirs_to_check.add(os.path.dirname(self.image.path))

        # Get all variants and their paths
        for variant in self.variants.all():
            if variant.file:
                image_paths.append(variant.file.path)
                dirs_to_check.add(os.path.dirname(variant.file.path))

        # Call the parent delete method
        super().delete(*args, **kwargs)

        # Delete the image files
        for path in image_paths:
            if os.path.isfile(path):
                default_storage.delete(path)

        # Check and remove empty directories
        for dir_path in dirs_to_check:
            if os.path.exists(dir_path) and not os.listdir(dir_path):
                os.rmdir(dir_path)

        logger.info(
            f"Image ID {self.id} and associated variant files successfully deleted ({len(image_paths)} files)"
        )
