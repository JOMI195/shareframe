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


_FRAME_TIMESTAMPS = (
    (
        "shareframe_frame_last_seen_timestamp_seconds",
        "last_seen",
        "Last heartbeat or websocket traffic from the frame",
    ),
    (
        "shareframe_frame_last_connected_timestamp_seconds",
        "last_connected",
        "Last websocket connect",
    ),
    (
        "shareframe_frame_registered_timestamp_seconds",
        "registered_at",
        "Registration time",
    ),
    (
        "shareframe_frame_websocket_last_active_timestamp_seconds",
        "frame_websocket_connections__last_active",
        "Last activity on the frame's open websocket connection",
    ),
)


class ShareframeFrameCollector:
    """Fleet roster, queried from the DB at scrape time. One series per frame."""

    def collect(self):
        try:
            yield from self._collect()
        except Exception:
            logger.exception("Failed to collect ShareFrame frame metrics")

    def _collect(self):
        from frames.models import Frame

        rows = list(
            Frame.objects.values(
                "public_serial_number",
                "version",
                "local_ip_address",
                "is_active",
                *[field for _, field, _ in _FRAME_TIMESTAMPS],
            )
        )

        info = GaugeMetricFamily(
            "shareframe_frame_info",
            "Registered frames, labelled with their current version and address",
            labels=["serial_number", "version", "local_ip_address"],
        )
        active = GaugeMetricFamily(
            "shareframe_frame_active",
            "Frame is flagged active",
            labels=["serial_number"],
        )
        connected = GaugeMetricFamily(
            "shareframe_frame_websocket_connected",
            "Frame holds an open websocket connection",
            labels=["serial_number"],
        )
        timestamps = {
            field: GaugeMetricFamily(name, documentation, labels=["serial_number"])
            for name, field, documentation in _FRAME_TIMESTAMPS
        }

        for row in rows:
            serial = [row["public_serial_number"]]
            info.add_metric(
                serial + [row["version"] or "", row["local_ip_address"] or ""], 1
            )
            active.add_metric(serial, int(row["is_active"]))
            connected.add_metric(
                serial,
                int(row["frame_websocket_connections__last_active"] is not None),
            )
            for field, gauge in timestamps.items():
                # A null column stays absent, so it reads as blank instead of 1970.
                if row[field] is not None:
                    gauge.add_metric(serial, row[field].timestamp())

        yield info
        yield active
        yield connected
        yield from timestamps.values()
