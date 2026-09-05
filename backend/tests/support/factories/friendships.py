import factory

from friendships.models import Friendship
from tests.support.factories.users import UserFactory


class FriendshipFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Friendship

    sender = factory.SubFactory(UserFactory)
    reciever = factory.SubFactory(UserFactory)
    status = "pending"
