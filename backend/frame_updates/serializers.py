from rest_framework import serializers
from .models import Release


class ReleaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Release
        fields = [
            "version",
            "download_url",
            "checksum",
            "release_notes",
            "release_date",
        ]


class VersionListSerializer(serializers.Serializer):
    versions = serializers.ListField(child=serializers.CharField())


class LatestVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Release
        fields = ["version", "download_url", "checksum"]
