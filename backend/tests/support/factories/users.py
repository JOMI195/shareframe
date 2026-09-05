import factory

from user_core.models import User


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        django_get_or_create = ("email",)

    username = factory.Sequence(lambda n: f"factory_user_{n}")
    email = factory.Sequence(lambda n: f"factory.user.{n}@shareframe.local")

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        # create_user builds the Account and enforces the username blacklist.
        password = kwargs.pop("password", "factory-pass1")
        return model_class.objects.create_user(password=password, **kwargs)
