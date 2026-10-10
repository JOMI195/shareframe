from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Account
from .notification_defaults import create_notification_preferences


@receiver(post_save, sender=Account)
def enable_notifications_for_new_accounts(sender, instance, created, raw, **kwargs):
    if created and not raw:
        create_notification_preferences([instance], enabled=True)
