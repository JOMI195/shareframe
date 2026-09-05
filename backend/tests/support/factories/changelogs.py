import factory
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from changelogs.models import Changelog


class ChangelogFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Changelog
        skip_postgeneration_save = True

    title = factory.Sequence(lambda n: f"Factory changelog {n}")
    date = factory.LazyFunction(lambda: timezone.now().date())
    is_published = True
    content_file = factory.LazyFunction(
        lambda: SimpleUploadedFile("notes.md", b"# Notes\n\nBody.\n")
    )

    @factory.post_generation
    def groups(self, create, extracted, **kwargs):
        if create and extracted:
            self.groups.set(extracted)
