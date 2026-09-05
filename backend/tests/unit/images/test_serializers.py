from types import SimpleNamespace

import pytest
from rest_framework.exceptions import ValidationError

from images.serializers import ImagesValidationMixin
from tests.support.helpers.images import upload_file, upload_with_checksum

validator = ImagesValidationMixin()


class TestSupportedFormats:
    @pytest.mark.parametrize("name", ["a.jpg", "a.JPG", "a.jpeg", "a.png"])
    def test_accepts_an_allowed_extension(self, name):
        assert validator.is_supported_file(name)

    @pytest.mark.parametrize("name", ["a.gif", "a.webp", "a.png.exe", "noextension"])
    def test_rejects_anything_else(self, name):
        assert not validator.is_supported_file(name)

    def test_an_empty_allow_list_permits_everything(self, settings):
        settings.IMAGES_ALLOWED_FORMATS = []

        assert validator.is_supported_file("a.gif")


class TestFileSizeLimit:
    def test_accepts_a_file_at_the_limit(self, settings):
        assert validator.respects_filesize_limit(settings.IMAGES_MAX_FILE_SIZE)

    def test_rejects_a_file_over_the_limit(self, settings):
        assert not validator.respects_filesize_limit(settings.IMAGES_MAX_FILE_SIZE + 1)

    def test_no_limit_permits_everything(self, settings):
        settings.IMAGES_MAX_FILE_SIZE = 0

        assert validator.respects_filesize_limit(10**12)


class TestChecksum:
    def test_accepts_the_matching_digest(self):
        upload, checksum = upload_with_checksum()

        assert validator.verify_checksum(upload, checksum)

    def test_rejects_a_different_digest(self):
        upload, _ = upload_with_checksum()

        assert not validator.verify_checksum(upload, "0" * 64)


class TestValidateFile:
    def test_accepts_a_well_formed_upload(self):
        upload, checksum = upload_with_checksum()

        assert validator.validate_file(upload, checksum) is upload

    def test_rejects_an_empty_filename(self):
        # Django refuses to hold an empty name on a real UploadedFile.
        nameless = SimpleNamespace(name="", size=10)

        with pytest.raises(ValidationError):
            validator.validate_file(nameless, "0" * 64)

    def test_rejects_an_unsupported_format(self):
        upload = upload_file(name="animation.gif")

        with pytest.raises(ValidationError):
            validator.validate_file(upload, "0" * 64)

    def test_rejects_a_mismatched_checksum(self):
        upload, _ = upload_with_checksum()

        with pytest.raises(ValidationError):
            validator.validate_file(upload, "0" * 64)
