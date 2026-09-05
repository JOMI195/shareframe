import factory
from django.core.files.uploadedfile import SimpleUploadedFile

from frame_updates.models import Release


class ReleaseFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Release
        skip_postgeneration_save = True

    version = factory.Sequence(lambda n: f"9.0.{n}")
    file = factory.LazyFunction(
        lambda: SimpleUploadedFile("firmware.bin", b"firmware payload")
    )
    checksum = factory.Faker("sha256")
    criticality = Release.UpdateCriticality.PATCH

    @factory.post_generation
    def groups(self, create, extracted, **kwargs):
        if create and extracted:
            self.groups.set(extracted)
