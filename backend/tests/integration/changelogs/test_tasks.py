import pytest
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile

from changelogs.models import ChangelogImage
from changelogs.tasks import send_changelog_email
from tests.support.factories import ChangelogFactory, UserFactory
from tests.support.helpers.images import upload_file

pytestmark = pytest.mark.django_db


def test_every_recipient_gets_a_separate_mail():
    users = [UserFactory(is_active=True) for _ in range(2)]

    send_changelog_email(ChangelogFactory().id, [user.email for user in users])

    assert sorted(message.to for message in mail.outbox) == sorted(
        [user.email] for user in users
    )


def test_the_mail_carries_title_body_and_link(settings):
    changelog = ChangelogFactory(
        title="Power",
        content_file=SimpleUploadedFile("pwr.md", b"New **power** button.\n"),
    )

    send_changelog_email(changelog.id, [UserFactory(is_active=True).email])

    message = mail.outbox[-1]
    assert message.subject == "ShareFrame - Power"
    assert "<strong>power</strong>" in message.body
    assert settings.FRONTEND_CHANGELOGS_URL in message.body


def test_referenced_images_are_attached_next_to_the_logo():
    changelog = ChangelogFactory(
        content_file=SimpleUploadedFile("pwr.md", b"::pwr::\n")
    )
    image = ChangelogImage.objects.create(
        changelog=changelog, tag="pwr", image=upload_file()
    )

    send_changelog_email(changelog.id, [UserFactory(is_active=True).email])

    content_ids = [part["Content-ID"] for part in mail.outbox[-1].attachments]
    assert content_ids == ["<logo_image>", f"<changelog_image_{image.pk}>"]
