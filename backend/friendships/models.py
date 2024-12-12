from django.db import models
from django.conf import settings

STATUS_LIST = [
    ("pending", "Pending"),
    ("accepted", "Accepted"),
    ("rejected", "Rejected"),
]


class Friendship(models.Model):
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="friendship_sender",
        on_delete=models.CASCADE,
    )
    reciever = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="friendship_reciever",
        on_delete=models.CASCADE,
    )

    status = models.CharField(max_length=10, choices=STATUS_LIST, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.sender.username}->{self.reciever.username}({self.status})"
