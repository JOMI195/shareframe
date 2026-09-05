import factory
from django.utils import timezone

from sent_images.models import SentImage
from tests.support.factories.images import ImageFactory
from tests.support.factories.users import UserFactory


class SentImageFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SentImage

    sender = factory.SubFactory(UserFactory)
    reciever = factory.SubFactory(UserFactory)
    image = factory.SubFactory(ImageFactory, user=factory.SelfAttribute("..sender"))
    expires_at = factory.LazyFunction(
        lambda: timezone.now() + timezone.timedelta(days=7)
    )

    class Params:
        expired = factory.Trait(
            expires_at=factory.LazyFunction(
                lambda: timezone.now() - timezone.timedelta(days=1)
            )
        )
