import base64
import json
from datetime import UTC, datetime
from pathlib import Path

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError

from frames.keys import public_key_fingerprint
from frames.models import Frame, FrameGroup
from friendships.models import Friendship
from images.management.commands.create_image_sizes import IMAGE_SIZES
from images.models import Image, ImageSize
from sent_images.models import SentImage
from user_accounts.models import Account
from user_core.models import User

SEED_DATA_FILE_NAME = "dev_seed_data.json"


class Command(BaseCommand):
    help = (
        "Seed deterministic users/accounts/frames/frame-groups/images/friendships/"
        "sent-images for dev/local environments."
    )

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

        seed_data = self._load_seed_data()
        self._validate_seed_assets(seed_data["images"])
        self._ensure_image_sizes()

        summary = {
            "users_created": 0,
            "users_updated": 0,
            "accounts_created": 0,
            "accounts_updated": 0,
            "groups_created": 0,
            "groups_updated": 0,
            "frames_created": 0,
            "frames_updated": 0,
            "frame_groups_added": 0,
            "images_created": 0,
            "images_reactivated": 0,
            "friendships_created": 0,
            "sent_images_created": 0,
        }

        users = self._ensure_users(seed_data["users"], summary)
        groups = self._ensure_groups(seed_data["groups"], summary)
        frame_facts = self._ensure_frames(seed_data["frames"], users, groups, summary)
        images = self._ensure_images(seed_data["images"], users, summary)
        self._ensure_friendships(seed_data["friendships"], users, summary)
        self._ensure_sent_images(seed_data["sent_images"], users, images, summary)

        self.stdout.write(self.style.SUCCESS("Seeded dev/local data."))
        for key, value in summary.items():
            self.stdout.write(f"- {key}: {value}")

        self.stdout.write("\nSeed frame credentials (test-only):")
        for frame_fact in frame_facts:
            self.stdout.write(
                "- {name}: serial={serial}, seed_b64={seed_b64}".format(
                    name=frame_fact["name"],
                    serial=frame_fact["serial"],
                    seed_b64=frame_fact["seed_b64"],
                )
            )

    @property
    def _seed_assets_dir(self):
        return Path(settings.BASE_DIR) / "seed_assets" / "images"

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

        required = {"users", "groups", "frames", "images", "friendships", "sent_images"}
        missing = sorted(required - set(seed_data.keys()))
        if missing:
            raise CommandError(
                f"Seed data file is missing required sections: {', '.join(missing)}"
            )

        for section in required:
            if not isinstance(seed_data.get(section), list):
                raise CommandError(f"Seed section '{section}' must be a JSON array.")

        return seed_data

    def _validate_seed_assets(self, image_specs):
        missing = []
        for spec in image_specs:
            path = self._seed_assets_dir / spec["file_name"]
            if not path.exists():
                missing.append(str(path))

        if missing:
            raise CommandError(
                "Seed image assets are missing:\n- " + "\n- ".join(missing)
            )

    def _ensure_image_sizes(self):
        for size_data in IMAGE_SIZES:
            ImageSize.objects.update_or_create(
                name=size_data["name"],
                defaults={
                    "width": size_data["width"],
                    "height": size_data["height"],
                    "quality": size_data["quality"],
                },
            )

    def _ensure_users(self, user_specs, summary):
        users = {}
        for spec in user_specs:
            user = User.objects.filter(username=spec["username"]).first()
            created = False
            if user is None:
                user = User.objects.create_user(
                    email=spec["email"],
                    username=spec["username"],
                    password=spec["password"],
                    is_active=True,
                )
                summary["users_created"] += 1
                summary["accounts_created"] += 1
                created = True
            else:
                updated_fields = []
                if not user.email:
                    user.email = spec["email"]
                    updated_fields.append("email")
                if not user.is_active:
                    user.is_active = True
                    updated_fields.append("is_active")
                if updated_fields:
                    user.save(update_fields=updated_fields)
                    summary["users_updated"] += 1

            account, account_created = self._get_or_create_account(user)
            if account_created:
                summary["accounts_created"] += 1
            if self._set_deterministic_account_code(
                account,
                spec["friendship_code"],
                force=created,
            ):
                summary["accounts_updated"] += 1

            users[spec["username"]] = user
        return users

    def _get_or_create_account(self, user):
        try:
            return user.account, False
        except Account.DoesNotExist:
            return Account.objects.create_account(user=user), True

    def _set_deterministic_account_code(self, account, code, force=False):
        if account.friendship_user_search_code == code:
            return False

        if account.friendship_user_search_code and not force:
            return False

        if (
            Account.objects.filter(friendship_user_search_code=code)
            .exclude(pk=account.pk)
            .exists()
        ):
            raise CommandError(
                f"Cannot assign deterministic account search code '{code}' because it is already used."
            )

        account.friendship_user_search_code = code
        account.save(update_fields=["friendship_user_search_code"])
        return True

    def _ensure_groups(self, group_specs, summary):
        groups = {}
        for spec in group_specs:
            group, created = FrameGroup.objects.get_or_create(
                name=spec["name"],
                defaults={"description": spec["description"]},
            )
            if created:
                summary["groups_created"] += 1
            elif not group.description:
                group.description = spec["description"]
                group.save(update_fields=["description"])
                summary["groups_updated"] += 1
            groups[spec["name"]] = group
        return groups

    def _ensure_frames(self, frame_specs, users, groups, summary):
        frame_facts = []
        for spec in frame_specs:
            owner = users[spec["owner_username"]]
            public_key, serial = self._derive_public_key_and_serial(spec["seed_b64"])

            self._validate_frame_collisions(
                serial=serial,
                private_serial_number=spec["private_serial_number"],
                public_key=public_key,
            )

            frame, created = Frame.objects.get_or_create(
                public_serial_number=serial,
                defaults={
                    "private_serial_number": spec["private_serial_number"],
                    "public_key": public_key,
                    "user": owner,
                    "is_active": True,
                    "version": spec["version"],
                    "local_ip_address": spec["local_ip_address"],
                },
            )
            if created:
                summary["frames_created"] += 1
            else:
                updated_fields = []
                if not frame.public_key:
                    frame.public_key = public_key
                    updated_fields.append("public_key")
                elif frame.public_key != public_key:
                    self.stdout.write(
                        self.style.WARNING(
                            "Frame {serial} has different public_key; preserving existing value."
                        ).format(serial=serial)
                    )
                if not frame.private_serial_number:
                    frame.private_serial_number = spec["private_serial_number"]
                    updated_fields.append("private_serial_number")
                if frame.user_id is None:
                    frame.user = owner
                    updated_fields.append("user")
                if not frame.version:
                    frame.version = spec["version"]
                    updated_fields.append("version")
                if not frame.local_ip_address:
                    frame.local_ip_address = spec["local_ip_address"]
                    updated_fields.append("local_ip_address")
                if updated_fields:
                    frame.save(update_fields=updated_fields)
                    summary["frames_updated"] += 1

            for group_name in spec["groups"]:
                if not frame.groups.filter(pk=groups[group_name].pk).exists():
                    frame.groups.add(groups[group_name])
                    summary["frame_groups_added"] += 1

            frame_facts.append(
                {
                    "name": spec["name"],
                    "serial": serial,
                    "seed_b64": spec["seed_b64"],
                    "public_key": public_key,
                }
            )
        return frame_facts

    def _validate_frame_collisions(self, serial, private_serial_number, public_key):
        if (
            Frame.objects.filter(private_serial_number=private_serial_number)
            .exclude(public_serial_number=serial)
            .exists()
        ):
            raise CommandError(
                f"private_serial_number '{private_serial_number}' already belongs to another frame."
            )

        if (
            Frame.objects.filter(public_key=public_key)
            .exclude(public_serial_number=serial)
            .exists()
        ):
            raise CommandError(
                f"public_key for serial '{serial}' already belongs to another frame."
            )

    def _derive_public_key_and_serial(self, seed_b64):
        try:
            seed_bytes = base64.b64decode(seed_b64)
        except Exception as exc:
            raise CommandError(f"Invalid base64 frame seed: {exc}") from exc
        if len(seed_bytes) != 32:
            raise CommandError("Frame seed must decode to exactly 32 bytes.")

        private_key = Ed25519PrivateKey.from_private_bytes(seed_bytes)
        public_key_bytes = private_key.public_key().public_bytes_raw()
        public_key = base64.b64encode(public_key_bytes).decode("ascii")
        serial = public_key_fingerprint(public_key)
        return public_key, serial

    def _ensure_images(self, image_specs, users, summary):
        images = {}
        for spec in image_specs:
            owner = users[spec["owner_username"]]
            image = (
                Image.objects.filter(
                    user=owner,
                    display_name=spec["display_name"],
                    markedAsDeleted=False,
                )
                .order_by("id")
                .first()
            )

            if image is not None:
                images[spec["display_name"]] = image
                continue

            deleted_image = (
                Image.objects.filter(user=owner, display_name=spec["display_name"])
                .order_by("id")
                .first()
            )
            if deleted_image is not None:
                deleted_image.markedAsDeleted = False
                deleted_image.auto_delete_after_period = False
                deleted_image.save(
                    update_fields_only=True,
                    update_fields=["markedAsDeleted", "auto_delete_after_period"],
                )
                images[spec["display_name"]] = deleted_image
                summary["images_reactivated"] += 1
                continue

            image_bytes = (self._seed_assets_dir / spec["file_name"]).read_bytes()
            image = Image(
                user=owner,
                display_name=spec["display_name"],
                auto_delete_after_period=False,
            )
            image.image.save(spec["file_name"], ContentFile(image_bytes), save=False)
            image.save()
            images[spec["display_name"]] = image
            summary["images_created"] += 1
        return images

    def _ensure_friendships(self, friendship_specs, users, summary):
        for spec in friendship_specs:
            _, created = Friendship.objects.get_or_create(
                sender=users[spec["sender"]],
                reciever=users[spec["reciever"]],
                status=spec["status"],
            )
            if created:
                summary["friendships_created"] += 1

    def _ensure_sent_images(self, sent_image_specs, users, images, summary):
        for spec in sent_image_specs:
            _, created = SentImage.objects.get_or_create(
                sender=users[spec["sender"]],
                reciever=users[spec["reciever"]],
                image=images[spec["image_display_name"]],
                expires_at=self._parse_expiry(spec["expires_at"]),
            )
            if created:
                summary["sent_images_created"] += 1

    def _parse_expiry(self, iso_value):
        try:
            parsed = datetime.fromisoformat(iso_value)
        except ValueError as exc:
            raise CommandError(f"Invalid sent image expires_at value '{iso_value}'.") from exc
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=UTC)
        return parsed
