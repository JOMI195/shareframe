import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from user_core.models import User
from user_stats.models import UserStats

SEED_FILE = "user-stats.json"


class Command(BaseCommand):
    help = "Seed deterministic per-user usage counters for dev/local environments."

    def add_arguments(self, parser):
        parser.add_argument(
            "--allow-production",
            action="store_true",
            help="Allow running seeding while PRODUCTION=True.",
        )

    def handle(self, *args, **options):
        if settings.PRODUCTION and not options["allow_production"]:
            raise CommandError(
                "Refusing to seed while PRODUCTION=True. "
                "Use --allow-production only when you explicitly intend this."
            )

        specs = self._load_section()
        users = self._users(specs)

        seeded = 0
        for spec in specs:
            counts = {field: spec[field] for field in UserStats.COUNTERS}
            stats, created = UserStats.objects.get_or_create(
                user=users[spec["username"]], defaults=counts
            )
            # Only untouched rows are filled, live counts are never reset.
            if not created and not any(
                getattr(stats, field) for field in UserStats.COUNTERS
            ):
                UserStats.objects.filter(pk=stats.pk).update(**counts)
                created = True
            seeded += created

        self.stdout.write(self.style.SUCCESS("Seeded dev/local user stats."))
        self.stdout.write(f"- user_stats_seeded: {seeded}")

    def _load_section(self):
        path = Path(settings.SEED_DATA_DIR) / SEED_FILE
        if not path.exists():
            raise CommandError(f"Seed data file not found: {path}")

        try:
            section = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise CommandError(f"Invalid JSON in {path}: {exc}") from exc

        if not isinstance(section, list):
            raise CommandError(f"{path} must contain a JSON array.")

        return section

    def _users(self, specs):
        usernames = {spec["username"] for spec in specs}
        users = {
            user.username: user for user in User.objects.filter(username__in=usernames)
        }
        missing = sorted(usernames - users.keys())
        if missing:
            raise CommandError(
                "Users are missing, run seed_dev_data first: " + ", ".join(missing)
            )
        return users
