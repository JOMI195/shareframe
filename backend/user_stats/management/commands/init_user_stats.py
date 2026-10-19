from django.core.management.base import BaseCommand

from user_core.models import User
from user_stats.models import UserStats


class Command(BaseCommand):
    help = "Create zeroed user stats for every existing user that has none yet."

    def handle(self, *args, **options):
        users = User.objects.filter(stats__isnull=True)
        created = UserStats.objects.bulk_create(
            [UserStats(user=user) for user in users.iterator()],
            batch_size=500,
            ignore_conflicts=True,
        )
        self.stdout.write(
            self.style.SUCCESS(f"Created user stats for {len(created)} users.")
        )
