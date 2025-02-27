import os
from django.conf import settings
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from .checksum import get_sha256_sum_from_file
from .models import Image, ImageSize, ImageVariant


class ImagesValidationMixin:
    def validate_file(self, file, expected_hash):
        if not file.name or file.name.strip() == "":
            raise ValidationError("Filename cannot be empty")
        if not self.is_supported_file(file.name):
            raise ValidationError("The file format is invalid")
        if not self.respects_filesize_limit(file.size):
            raise ValidationError("The file size is too large")
        if not self.verify_checksum(file, expected_hash):
            raise ValidationError(
                "Checksum verification failed. The file may be corrupted on upload."
            )
        return file

    def is_supported_file(self, file_name):
        name, extension = os.path.splitext(file_name)
        extension = extension[1:].lower()
        allowed_formats = settings.IMAGES_ALLOWED_FORMATS
        if not bool(allowed_formats):
            return True
        return extension in allowed_formats

    def respects_filesize_limit(self, size):
        max_file_size = settings.IMAGES_MAX_FILE_SIZE
        if not max_file_size:
            return True
        return size <= max_file_size

    def verify_checksum(self, file, expected_hash):
        computed_hash = get_sha256_sum_from_file(file)
        return computed_hash == expected_hash


class ImageCreateSerializer(ImagesValidationMixin, serializers.ModelSerializer):
    image = serializers.ImageField()
    upload_image_sha256_hex_hash = serializers.CharField()

    class Meta:
        model = Image
        fields = ("image", "upload_image_sha256_hex_hash")
        read_only_fields = ("name", "size", "created_at", "width", "height", "format")

    def validate(self, data):
        image_file = data.get("image")
        upload_image_hash = data.get("upload_image_sha256_hex_hash")
        self.validate_file(image_file, upload_image_hash)
        return data

    def create(self, validated_data):
        validated_data.pop("upload_image_sha256_hex_hash", None)
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class ImageVariantSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    size_name = serializers.CharField(source="image_size.name", read_only=True)
    width = serializers.IntegerField(source="image_size.width", read_only=True)
    height = serializers.IntegerField(source="image_size.height", read_only=True)

    class Meta:
        model = ImageVariant
        fields = ("url", "size_name", "width", "height")

    def get_url(self, obj):
        return obj.file.url if obj.file else None


class ImageRetrieveSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    variants = ImageVariantSerializer(many=True, read_only=True)

    def get_url(self, obj):
        return obj.image.url

    class Meta:
        model = Image
        fields = (
            "id",
            "name",
            "size",
            "width",
            "height",
            "format",
            "created_at",
            "url",
            "variants",
        )
        read_only_fields = fields


class ImageDestroySerializer(serializers.ModelSerializer):
    class Meta:
        model = Image
        fields = ()


class ImageSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImageSize
        fields = ("id", "name", "width", "height", "quality")
        read_only_fields = fields
