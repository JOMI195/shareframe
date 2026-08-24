import logging

from django.core.files.storage import default_storage
from django.db.models import Count, Q, Sum
from django.utils import timezone
from prometheus_client.core import GaugeMetricFamily

logger = logging.getLogger("default")


def _variant_bytes(variant_model, storage):
    total = 0
    names = variant_model.objects.filter(
        parent_image__markedAsDeleted=False
    ).values_list("file", flat=True)
    for name in names:
        try:
            total += storage.size(name)
        except (OSError, NotImplementedError, ValueError):
            continue
    return total


def _gauge(name, documentation, value):
    gauge = GaugeMetricFamily(name, documentation)
    gauge.add_metric([], value)
    return gauge


class ShareframeBusinessCollector:
    """Business metrics, queried from the DB at scrape time."""

    def collect(self):
        try:
            yield from self._collect()
        except Exception:
            logger.exception("Failed to collect ShareFrame business metrics")

    def _collect(self):
        from images.models import Image, ImageVariant
        from sent_images.models import SentImage
        from user_core.models import User

        now = timezone.now()

        images = {
            row["markedAsDeleted"]: row
            for row in Image.objects.values("markedAsDeleted").annotate(
                count=Count("id"), size=Sum("size")
            )
        }
        stored = images.get(False) or {}
        marked = images.get(True) or {}

        yield _gauge(
            "shareframe_images_total",
            "Stored images excluding soft-deleted ones",
            stored.get("count", 0),
        )
        yield _gauge(
            "shareframe_images_storage_bytes",
            "Bytes held by stored images: originals plus every generated variant",
            (stored.get("size") or 0) + _variant_bytes(ImageVariant, default_storage),
        )
        yield _gauge(
            "shareframe_images_marked_deleted_total",
            "Images marked for deletion",
            marked.get("count", 0),
        )

        yield _gauge(
            "shareframe_users_total",
            "Users excluding soft-deleted ones",
            User.objects.filter(is_deleted=False).count(),
        )

        sent = SentImage.objects.aggregate(
            total=Count("id"), expired=Count("id", filter=Q(expires_at__lt=now))
        )
        yield _gauge("shareframe_sent_images_total", "Sent image records", sent["total"])
        yield _gauge(
            "shareframe_sent_images_expired",
            "Sent images past their expiry",
            sent["expired"],
        )
