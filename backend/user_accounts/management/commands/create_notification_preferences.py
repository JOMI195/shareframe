from django.core.management.base import BaseCommand

from user_accounts.models import (
    Account,
    NotificationKindPreference,
    NotificationPreference,
)
from user_accounts.notification_defaults import create_notification_preferences


class Command(BaseCommand):
    help = (
        "Create the missing notification preferences of every account, switched on. "
        "Existing preferences are left unchanged."
    )

    def handle(self, *args, **options):
        before = self._count()
        create_notification_preferences(Account.objects.all(), enabled=True)
        self.stdout.write(
            self.style.SUCCESS(
                f"Created {self._count() - before} missing notification preferences."
            )
        )

    def _count(self):
        return (
            NotificationKindPreference.objects.count()
            + NotificationPreference.objects.count()
        )
