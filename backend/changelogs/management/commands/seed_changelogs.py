import json
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError

from changelogs.models import Changelog
from frames.models import FrameGroup

SEED_DATA_FILE_NAME = "changelog_seed_data.json"


class Command(BaseCommand):
    help = "Seed deterministic changelog entries for dev/local environments."

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

        specs = self._load_seed_data()
        self._validate_seed_assets(specs)

        summary = {
            "changelogs_created": 0,
            "changelogs_updated": 0,
            "content_files_written": 0,
            "group_links_set": 0,
        }

        for spec in specs:
            self._ensure_changelog(spec, summary)

        self.stdout.write(self.style.SUCCESS("Seeded dev/local changelogs."))
        for key, value in summary.items():
            self.stdout.write(f"- {key}: {value}")

    @property
    def _seed_assets_dir(self):
        return Path(settings.BASE_DIR) / "seed_assets" / "changelogs"

    @property
    def _seed_data_path(self):
        return Path(settings.BASE_DIR) / "seed_assets" / SEED_DATA_FILE_NAME

    def _load_seed_data(self):
        if not self._seed_data_path.exists():
            raise CommandError(f"Seed data file not found: {self._seed_data_path}")

        try:
            seed_data = json.loads(self._seed_data_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise CommandError(f"Invalid JSON in {self._seed_data_path}: {exc}") from exc

        if not isinstance(seed_data.get("changelogs"), list):
            raise CommandError("Seed section 'changelogs' must be a JSON array.")

        return seed_data["changelogs"]

    def _validate_seed_assets(self, specs):
        missing = [
            str(self._seed_assets_dir / spec["content_file_name"])
            for spec in specs
            if not (self._seed_assets_dir / spec["content_file_name"]).exists()
        ]

        if missing:
            raise CommandError(
                "Seed changelog assets are missing:\n- " + "\n- ".join(missing)
            )

    def _ensure_changelog(self, spec, summary):
        date = datetime.strptime(spec["date"], "%Y-%m-%d").date()
        changelog = Changelog.objects.filter(title=spec["title"]).first()

        if changelog is None:
            changelog = Changelog.objects.create(
                title=spec["title"],
                date=date,
                is_published=spec["is_published"],
            )
            summary["changelogs_created"] += 1
        else:
            updated_fields = []
            if changelog.date != date:
                changelog.date = date
                updated_fields.append("date")
            if changelog.is_published != spec["is_published"]:
                changelog.is_published = spec["is_published"]
                updated_fields.append("is_published")
            if updated_fields:
                changelog.save(update_fields=updated_fields)
                summary["changelogs_updated"] += 1

        self._ensure_content_file(changelog, spec, summary)
        self._ensure_groups(changelog, spec, summary)

    def _ensure_content_file(self, changelog, spec, summary):
        content = (self._seed_assets_dir / spec["content_file_name"]).read_text(
            encoding="utf-8"
        )

        # The upload path stamps a timestamp, so an unconditional write churns a new file every run.
        if changelog.content_file and changelog.get_markdown_content() == content:
            return

        changelog.content_file.save(
            spec["content_file_name"], ContentFile(content.encode("utf-8")), save=True
        )
        summary["content_files_written"] += 1

    def _ensure_groups(self, changelog, spec, summary):
        groups = FrameGroup.objects.filter(name__in=spec["groups"])
        found = {group.name for group in groups}
        missing = sorted(set(spec["groups"]) - found)

        if missing:
            raise CommandError(
                "Frame groups are missing, run seed_dev_data first: " + ", ".join(missing)
            )

        changelog.groups.set(groups)
        summary["group_links_set"] += len(found)
