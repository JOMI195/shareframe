import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError

from changelogs.models import Changelog, ChangelogImage
from tests.support import seed
from tests.support.factories import ChangelogFactory, FrameGroupFactory
from tests.support.helpers.images import upload_file

pytestmark = pytest.mark.django_db


def test_reads_the_markdown_body():
    changelog = ChangelogFactory()

    assert changelog.get_markdown_content() == "# Notes\n\nBody.\n"


def test_a_changelog_without_a_file_has_no_body():
    changelog = ChangelogFactory(content_file=None)

    assert changelog.get_markdown_content() == ""


def test_the_seeded_bodies_come_from_the_asset_files():
    entry = seed.changelogs()[0]
    source = (seed.assets_dir() / "changelogs" / entry["content_file_name"]).read_text()

    stored = Changelog.objects.get(title=entry["title"]).get_markdown_content()

    assert stored == source


def test_replacing_the_file_removes_the_old_one():
    changelog = ChangelogFactory()
    old_name = changelog.content_file.name
    storage = changelog.content_file.storage

    changelog.content_file = SimpleUploadedFile("new.md", b"# New\n")
    changelog.save()

    assert not storage.exists(old_name)
    assert changelog.get_markdown_content() == "# New\n"


def test_deleting_removes_the_file():
    changelog = ChangelogFactory()
    name, storage = changelog.content_file.name, changelog.content_file.storage

    changelog.delete()

    assert not storage.exists(name)


def test_newest_first():
    older = ChangelogFactory(date="2020-01-01")
    newer = ChangelogFactory(date="2030-01-01")

    ordered = list(Changelog.objects.filter(pk__in=[older.pk, newer.pk]))

    assert ordered == [newer, older]


def test_groups_can_be_attached():
    group = FrameGroupFactory()
    changelog = ChangelogFactory(groups=[group])

    assert list(changelog.groups.all()) == [group]


def test_the_seeded_changelogs_are_linked_to_their_groups():
    for entry in seed.changelogs():
        changelog = Changelog.objects.get(title=entry["title"])

        assert set(changelog.groups.values_list("name", flat=True)) == set(entry["groups"])


def test_one_image_per_tag_per_changelog():
    changelog = ChangelogFactory()
    ChangelogImage.objects.create(changelog=changelog, tag="hero", image=upload_file())

    with pytest.raises(IntegrityError):
        ChangelogImage.objects.create(
            changelog=changelog, tag="hero", image=upload_file()
        )


def test_the_same_tag_may_be_used_on_another_changelog():
    first = ChangelogFactory()
    second = ChangelogFactory()
    ChangelogImage.objects.create(changelog=first, tag="hero", image=upload_file())

    ChangelogImage.objects.create(changelog=second, tag="hero", image=upload_file())


def test_deleting_an_image_removes_its_file():
    changelog = ChangelogFactory()
    image = ChangelogImage.objects.create(
        changelog=changelog, tag="hero", image=upload_file()
    )
    name, storage = image.image.name, image.image.storage

    image.delete()

    assert not storage.exists(name)
