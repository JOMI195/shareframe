from django.db.models import F
from django.db.models.functions import Now

from .models import UserStats


def bump(user, field, by=1):
    if user is None:
        return
    UserStats.objects.get_or_create(user=user)
    UserStats.objects.filter(user=user).update(
        **{field: F(field) + by}, updated_at=Now()
    )


def record_send(sender, reciever):
    bump(sender, "images_sent")
    bump(reciever, "images_received")
