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
            "criticality",
        ]


class VersionListSerializer(serializers.Serializer):
    versions = serializers.ListField(child=serializers.CharField())
