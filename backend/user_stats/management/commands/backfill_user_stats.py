from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Count
from django.utils import timezone

from images.models import Image
from sent_images.models import SentImage
from user_core.models import User
from user_stats.models import UserStats


def _counts(queryset, field):
    return dict(queryset.values_list(field).annotate(n=Count("id")).order_by())


class Command(BaseCommand):
    help = (
        "Overwrite the user stats of every existing user with counts "
        "recomputed from the photos and sends still in the database."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show the changes without writing them.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        counts = {
            "images_uploaded": _counts(Image.objects.all(), "user"),
            "images_sent": _counts(SentImage.objects.sent(), "sender"),
            "images_received": _counts(SentImage.objects.sent(), "reciever"),
        }

        with transaction.atomic():
            users = User.objects.filter(is_deleted=False)
            UserStats.objects.bulk_create(
                [UserStats(user=user) for user in users.filter(stats__isnull=True)],
                batch_size=500,
                ignore_conflicts=True,
            )

            now = timezone.now()
            rows = list(
                UserStats.objects.filter(user__in=users)
                .select_related("user")
                .select_for_update(of=("self",))
            )
            for stats in rows:
                changes = []
                for field in UserStats.COUNTERS:
                    new = counts[field].get(stats.user_id, 0)
                    changes.append(f"{field} {getattr(stats, field)} -> {new}")
                    setattr(stats, field, new)
                stats.updated_at = now
                if dry_run or options["verbosity"] > 1:
                    self.stdout.write(f"- {stats.user.username}: {', '.join(changes)}")

            UserStats.objects.bulk_update(
                rows, (*UserStats.COUNTERS, "updated_at"), batch_size=500
            )
            if dry_run:
                transaction.set_rollback(True)

        prefix = "Dry run, would backfill" if dry_run else "Backfilled"
        self.stdout.write(
            self.style.SUCCESS(f"{prefix} user stats for {len(rows)} users.")
        )
