import json
from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from notifications.choices import NotificationChannel, NotificationKind
from notifications.models import Notification
from user_accounts.models import Account, NotificationPreference

SECTION_FILES = {
    "preferences": "notification-preferences.json",
    "notifications": "notifications.json",
}


class Command(BaseCommand):
    help = "Seed deterministic notification preferences and history for dev/local environments."

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

        seed_data = {
            section: self._load_section(file_name)
            for section, file_name in SECTION_FILES.items()
        }
        specs = seed_data["preferences"] + seed_data["notifications"]
        self._validate_choices(specs)
        accounts = self._accounts(specs)

        summary = {
            "preferences_created": 0,
            "preferences_updated": 0,
            "notifications_created": 0,
        }

        for spec in seed_data["preferences"]:
            self._ensure_preference(spec, accounts, summary)
        for spec in seed_data["notifications"]:
            self._ensure_notification(spec, accounts, summary)

        self.stdout.write(self.style.SUCCESS("Seeded dev/local notifications."))
        for key, value in summary.items():
            self.stdout.write(f"- {key}: {value}")

    def _load_section(self, file_name):
        path = Path(settings.SEED_DATA_DIR) / file_name
        if not path.exists():
            raise CommandError(f"Seed data file not found: {path}")

        try:
            section = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise CommandError(f"Invalid JSON in {path}: {exc}") from exc

        if not isinstance(section, list):
            raise CommandError(f"{path} must contain a JSON array.")

        return section

    def _validate_choices(self, specs):
        invalid = [
            f"{spec['username']}: {spec['kind']} / {spec['channel']}"
            for spec in specs
            if spec["kind"] not in NotificationKind.values
            or spec["channel"] not in NotificationChannel.values
        ]
        if invalid:
            raise CommandError(
                "Unknown notification kind or channel:\n- " + "\n- ".join(invalid)
            )

    def _accounts(self, specs):
        usernames = {spec["username"] for spec in specs}
        accounts = {
            account.user.username: account
            for account in Account.objects.filter(
                user__username__in=usernames
            ).select_related("user")
        }
        missing = sorted(usernames - accounts.keys())
        if missing:
            raise CommandError(
                "Accounts are missing, run seed_dev_data first: " + ", ".join(missing)
            )
        return accounts

    def _ensure_preference(self, spec, accounts, summary):
        preference, created = NotificationPreference.objects.get_or_create(
            account=accounts[spec["username"]],
            kind=spec["kind"],
            channel=spec["channel"],
            defaults={"enabled": spec["enabled"]},
        )
        if created:
            summary["preferences_created"] += 1
        elif preference.enabled != spec["enabled"]:
            preference.enabled = spec["enabled"]
            preference.save(update_fields=["enabled"])
            summary["preferences_updated"] += 1

    def _ensure_notification(self, spec, accounts, summary):
        lookup = {
            "account": accounts[spec["username"]],
            "kind": spec["kind"],
            "channel": spec["channel"],
        }
        if Notification.objects.filter(**lookup).exists():
            return

        notification = Notification.objects.create(**lookup)
        # sent_at is auto_now_add, so it is backdated after creation.
        Notification.objects.filter(pk=notification.pk).update(
            sent_at=timezone.now() - timedelta(days=spec["sent_days_ago"])
        )
        summary["notifications_created"] += 1
