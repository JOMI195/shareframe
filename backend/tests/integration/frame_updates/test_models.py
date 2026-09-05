import pytest
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile

from frame_updates.models import Release
from tests.support.factories import FrameGroupFactory, ReleaseFactory

pytestmark = pytest.mark.django_db


def test_saving_persists_a_valid_release():
    assert ReleaseFactory(version="1.2.3").version == "1.2.3"


def test_saving_runs_the_version_validation():
    """save() calls full_clean(), so an invalid version never reaches the table."""
    with pytest.raises(ValidationError):
        ReleaseFactory(version="1.0")


def test_the_version_is_unique():
    ReleaseFactory(version="4.5.6")

    with pytest.raises(ValidationError):
        ReleaseFactory(version="4.5.6")


def test_the_default_criticality_is_patch():
    assert ReleaseFactory().criticality == Release.UpdateCriticality.PATCH


def test_criticality_is_limited_to_the_choices():
    with pytest.raises(ValidationError):
        ReleaseFactory(criticality="Whenever")


def test_replacing_the_file_removes_the_old_one():
    release = ReleaseFactory()
    old_name, storage = release.file.name, release.file.storage

    release.file = SimpleUploadedFile("newer.bin", b"newer payload")
    release.save()

    assert not storage.exists(old_name)


def test_deleting_removes_the_file():
    release = ReleaseFactory()
    name, storage = release.file.name, release.file.storage

    release.delete()

    assert not storage.exists(name)


def test_releases_can_be_scoped_to_groups():
    group = FrameGroupFactory()

    assert list(ReleaseFactory(groups=[group]).groups.all()) == [group]


def test_newest_release_first():
    older = ReleaseFactory()
    newer = ReleaseFactory()

    assert list(Release.objects.filter(pk__in=[older.pk, newer.pk])) == [newer, older]


def test_the_upload_lands_under_the_frame_updates_prefix():
    assert ReleaseFactory().file.name.startswith("frame-updates/")
