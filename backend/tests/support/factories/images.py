import factory

from images.models import Image, ImageSize, TextPreset
from tests.support.factories.users import UserFactory
from tests.support.helpers.images import upload_file


class ImageSizeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ImageSize

    name = factory.Sequence(lambda n: f"factory-size-{n}")
    width = 100
    height = None
    quality = 85


class ImageFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Image

    user = factory.SubFactory(UserFactory)
    # Image.save() reads the file, so it has to be a real one.
    image = factory.LazyFunction(upload_file)
    display_name = factory.Sequence(lambda n: f"factory image {n}")
    size = 0


class TextPresetFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TextPreset

    user = factory.SubFactory(UserFactory)
    text = factory.Sequence(lambda n: f"Vorlage {n}")
    x = 0.5
    y = 0.5
    font_size = 0.125
    color = TextPreset.Color.BLACK
    font = TextPreset.Font.SANS
