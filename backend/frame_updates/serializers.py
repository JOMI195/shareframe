from rest_framework import serializers
from .models import Release


class ReleaseSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = Release
        fields = [
            "version",
            "download_url",
            "checksum",
            "release_notes",
            "release_date",
            "criticality",
        ]

    def get_download_url(self, obj):
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class VersionListSerializer(serializers.Serializer):
    versions = serializers.ListField(child=serializers.CharField())
