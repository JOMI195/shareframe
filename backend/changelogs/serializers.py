from rest_framework import serializers
from .models import Changelog, ChangelogImage


class ChangelogIdSerializer(serializers.ModelSerializer):
    class Meta:
        model = Changelog
        fields = ["id", "date", "title", "is_published"]


class ChangelogsSerializer(serializers.ModelSerializer):
    content = serializers.SerializerMethodField()

    class Meta:
        model = Changelog
        fields = [
            "id",
            "date",
            "title",
            "is_published",
            "content",
            "created_at",
            "updated_at",
        ]

    def get_content(self, obj):
        raw_markdown = obj.get_markdown_content()
        images = obj.images.all()

        request = self.context.get("request", None)

        for image in images:
            placeholder = f"::{image.tag}::"

            if request:
                image_url = request.build_absolute_uri(image.image.url)
            else:
                # Fallback: relative URL
                image_url = image.image.url

            markdown_img = f"![{image.description or image.tag}]({image_url})"
            raw_markdown = raw_markdown.replace(placeholder, markdown_img)

        return raw_markdown


class ChangelogImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ChangelogImage
        fields = ["tag", "description", "image_url"]

    def get_image_url(self, obj):
        request = self.context.get("request")
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url if obj.image else None
