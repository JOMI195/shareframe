import base64
import os

import factory
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from django.utils import timezone

from frames.keys import public_key_fingerprint
from frames.models import Frame, FrameGroup, FrameOTP, FrameToken


def keypair():
    private = Ed25519PrivateKey.generate()
    seed = base64.b64encode(private.private_bytes_raw()).decode()
    public = base64.b64encode(private.public_key().public_bytes_raw()).decode()
    return seed, public


class FrameGroupFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = FrameGroup

    name = factory.Sequence(lambda n: f"factory-group-{n}")
    description = "built by a factory"


class FrameFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Frame
        skip_postgeneration_save = True

    user = None
    private_serial_number = factory.Sequence(lambda n: f"FACTORY-PRIVATE-{n:04d}")
    public_key = factory.LazyFunction(lambda: keypair()[1])
    public_serial_number = factory.LazyAttribute(
        lambda o: public_key_fingerprint(o.public_key)
    )
    version = "7.3.0"

    @factory.post_generation
    def groups(self, create, extracted, **kwargs):
        if create and extracted:
            self.groups.set(extracted)


class FrameTokenFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = FrameToken

    frame = factory.SubFactory(FrameFactory)
    access_token = factory.Faker("uuid4")
    access_token_expires_at = factory.LazyFunction(
        lambda: timezone.now() + timezone.timedelta(days=7)
    )

    class Params:
        expired = factory.Trait(
            access_token_expires_at=factory.LazyFunction(
                lambda: timezone.now() - timezone.timedelta(minutes=1)
            )
        )


class FrameOTPFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = FrameOTP

    frame = factory.SubFactory(FrameFactory)
    expires_at = factory.LazyFunction(
        lambda: timezone.now() + timezone.timedelta(minutes=10)
    )

    class Params:
        expired = factory.Trait(
            expires_at=factory.LazyFunction(
                lambda: timezone.now() - timezone.timedelta(minutes=1)
            )
        )
