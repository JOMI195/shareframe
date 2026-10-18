import logging
import re
from datetime import timedelta

import redis
from django.core.files.storage import default_storage
from django.db import connection
from django.db.models import Count, Max, Q, Sum
from django.utils import timezone
from prometheus_client.core import GaugeMetricFamily

logger = logging.getLogger("default")


def _variant_bytes(variant_model, storage):
    total = 0
    names = variant_model.objects.values_list("file", flat=True)
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


def _counts_by(name, documentation, label, rows):
    gauge = GaugeMetricFamily(name, documentation, labels=[label])
    for row in rows:
        gauge.add_metric([row[label]], row["count"])
    return gauge


class ShareframeBusinessCollector:
    """Business metrics, queried from the DB at scrape time."""

    def collect(self):
        try:
            yield from self._collect()
        except Exception:
            logger.exception("Failed to collect ShareFrame business metrics")

    def _collect(self):
        from frames.models import Frame, FrameCommand
        from friendships.models import Friendship
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
            "Bytes on disk for all images, including ones marked for deletion: "
            "originals plus every generated variant",
            (stored.get("size") or 0)
            + (marked.get("size") or 0)
            + _variant_bytes(ImageVariant, default_storage),
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

        sent = SentImage.objects.sent().aggregate(
            total=Count("id"), expired=Count("id", filter=Q(expires_at__lt=now))
        )
        yield _gauge(
            "shareframe_sent_images_total", "Delivered sent images", sent["total"]
        )
        yield _gauge(
            "shareframe_sent_images_scheduled",
            "Sent images waiting for their scheduled time",
            SentImage.objects.scheduled().count(),
        )
        yield _gauge(
            "shareframe_sent_images_expired",
            "Sent images past their expiry",
            sent["expired"],
        )

        day_ago = now - timedelta(days=1)
        yield _gauge(
            "shareframe_images_uploaded_24h",
            "Images uploaded in the last 24 hours",
            Image.objects.filter(created_at__gte=day_ago).count(),
        )
        yield _gauge(
            "shareframe_sent_images_sent_24h",
            "Images delivered to a frame in the last 24 hours",
            SentImage.objects.sent().filter(sent_at__gte=day_ago).count(),
        )

        live_users = User.objects.filter(is_deleted=False)
        active = GaugeMetricFamily(
            "shareframe_users_active",
            "Users who logged in within the window",
            labels=["window"],
        )
        for window, days in (("1d", 1), ("7d", 7), ("30d", 30)):
            active.add_metric(
                [window],
                live_users.filter(last_login__gte=now - timedelta(days=days)).count(),
            )
        yield active
        yield _gauge(
            "shareframe_users_joined_24h",
            "Users who signed up in the last 24 hours",
            live_users.filter(date_joined__gte=day_ago).count(),
        )

        yield _counts_by(
            "shareframe_friendships",
            "Friendships by status",
            "status",
            Friendship.objects.values("status").annotate(count=Count("id")),
        )
        yield _counts_by(
            "shareframe_frame_commands_24h",
            "Frame commands created in the last 24 hours, by status",
            "status",
            FrameCommand.objects.filter(created_at__gte=day_ago)
            .values("status")
            .annotate(count=Count("id")),
        )
        yield _gauge(
            "shareframe_frames_registered",
            "Registered frames",
            Frame.objects.count(),
        )

        if connection.vendor == "postgresql":
            with connection.cursor() as cursor:
                cursor.execute("SELECT pg_database_size(current_database())")
                yield _gauge(
                    "shareframe_database_size_bytes",
                    "Size of the application database",
                    cursor.fetchone()[0],
                )


_FRAME_TIMESTAMPS = (
    (
        "shareframe_frame_last_seen_timestamp_seconds",
        "last_seen",
        "Last heartbeat, websocket connect or websocket message from the frame",
    ),
    (
        "shareframe_frame_last_heartbeat_timestamp_seconds",
        "last_heartbeat",
        "Last heartbeat from the frame",
    ),
    (
        "shareframe_frame_last_update_check_timestamp_seconds",
        "last_update_check",
        "Last update check by the frame",
    ),
    (
        "shareframe_frame_last_update_attempt_timestamp_seconds",
        "last_update_attempt",
        "Last release bundle download granted to the frame",
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


# A heartbeat is due every few minutes; older snapshots describe a frame that is off.
TELEMETRY_FRESH_SECONDS = 900

_TELEMETRY_GAUGES = frozenset(
    {
        "uptime_seconds",
        "boot_count",
        "cpu_temp_celsius",
        "cpu_usage_percent",
        "cpu_freq_mhz",
        "load_1",
        "load_5",
        "load_15",
        "ram_total_bytes",
        "ram_available_bytes",
        "ram_available_min_bytes",
        "storage_data_total_bytes",
        "storage_data_free_bytes",
        "storage_root_total_bytes",
        "storage_root_free_bytes",
        "data_written_kb",
        "crash_count",
        "unclean_resets",
        "oom_kills",
        "uv_events",
        "temp_peak_celsius",
        "slot_trial",
        "wlan_connected",
        "wlan_signal_dbm",
        "image_count",
    }
)
_SERVICES = frozenset({"websocket", "display", "dashboard", "update", "heartbeat"})
_PROCESS_KEY = re.compile(
    r"^proc_([a-z]+)_(rss_bytes|rss_peak_bytes|heap_bytes|stack_bytes|threads|fds)$"
)
_DISPLAY_KEY = re.compile(r"^display_([a-z0-9_]{1,48})$")
_HEALTH_CHECKS = {
    "health_state": "overall",
    "health_oom": "oom",
    "health_temp": "temp",
    "health_disk": "disk",
    "display_health": "display",
}
_BUILD_LABELS = ("version", "app_sha", "os_sha", "kernel", "boot_slot", "sd_card")


def _number(value):
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, (int, float)):
        return value
    return None


def telemetry_samples(telemetry):
    """Maps a heartbeat body onto (metric, labels, value). Unknown keys are dropped."""
    for key, value in telemetry.items():
        number = _number(value)
        if key in _HEALTH_CHECKS:
            if isinstance(value, str):
                yield (
                    "shareframe_frame_health",
                    {"check": _HEALTH_CHECKS[key], "status": value},
                    1,
                )
            continue
        if number is None:
            continue
        if key in _TELEMETRY_GAUGES:
            yield f"shareframe_frame_{key}", {}, number
        elif key.endswith("_running") and key.removesuffix("_running") in _SERVICES:
            yield (
                "shareframe_frame_service_running",
                {"service": key.removesuffix("_running")},
                number,
            )
        elif (match := _PROCESS_KEY.match(key)) and match[1] in _SERVICES:
            yield f"shareframe_frame_process_{match[2]}", {"service": match[1]}, number
        elif match := _DISPLAY_KEY.match(key):
            yield f"shareframe_frame_display_{match[1]}", {}, number

    reason = telemetry.get("safe_mode")
    yield (
        "shareframe_frame_safe_mode",
        {"reason": str(reason) if reason else ""},
        int(bool(reason)),
    )
    yield (
        "shareframe_frame_build_info",
        {label: str(telemetry.get(label) or "") for label in _BUILD_LABELS},
        1,
    )


class ShareframeFrameCollector:
    """Fleet roster, queried from the DB at scrape time. One series per frame."""

    # Stops the auto-describing global registry from calling collect() at startup.
    def describe(self):
        return []

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
                "last_telemetry",
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

        fresh_after = timezone.now() - timedelta(seconds=TELEMETRY_FRESH_SECONDS)
        telemetry = {}

        for row in rows:
            serial = [row["public_serial_number"]]
            if (
                row["last_telemetry"]
                and row["last_heartbeat"]
                and row["last_heartbeat"] >= fresh_after
            ):
                for name, labels, value in telemetry_samples(row["last_telemetry"]):
                    if name not in telemetry:
                        telemetry[name] = GaugeMetricFamily(
                            name,
                            "Frame telemetry from the latest heartbeat",
                            labels=["serial_number", *labels],
                        )
                    telemetry[name].add_metric(serial + list(labels.values()), value)
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
        yield from telemetry.values()


_REDIS_INFO = (
    ("shareframe_redis_used_memory_bytes", "used_memory", "Redis memory in use"),
    ("shareframe_redis_maxmemory_bytes", "maxmemory", "Redis memory limit"),
    (
        "shareframe_redis_evicted_keys_total",
        "evicted_keys",
        "Keys Redis evicted under its maxmemory policy since start",
    ),
    (
        "shareframe_redis_connected_clients",
        "connected_clients",
        "Open Redis client connections",
    ),
)


class ShareframeCeleryCollector:
    """Task outcomes from the django-db result backend, plus broker health."""

    def describe(self):
        return []

    def collect(self):
        try:
            yield from self._collect_tasks()
        except Exception:
            logger.exception("Failed to collect ShareFrame task metrics")
        try:
            yield from self._collect_broker()
        except Exception:
            logger.exception("Failed to collect ShareFrame broker metrics")

    def _collect_tasks(self):
        from django_celery_results.models import TaskResult

        day_ago = timezone.now() - timedelta(days=1)
        rows = (
            TaskResult.objects.filter(task_name__isnull=False)
            .values("task_name")
            .annotate(
                last_success=Max("date_done", filter=Q(status="SUCCESS")),
                last_failure=Max("date_done", filter=Q(status="FAILURE")),
                runs=Count("id", filter=Q(date_done__gte=day_ago)),
                failures=Count(
                    "id", filter=Q(date_done__gte=day_ago, status="FAILURE")
                ),
            )
        )

        families = {
            "last_success": GaugeMetricFamily(
                "shareframe_celery_task_last_success_timestamp_seconds",
                "Last successful run of the task",
                labels=["task"],
            ),
            "last_failure": GaugeMetricFamily(
                "shareframe_celery_task_last_failure_timestamp_seconds",
                "Last failed run of the task",
                labels=["task"],
            ),
            "runs": GaugeMetricFamily(
                "shareframe_celery_task_runs_24h",
                "Finished runs of the task in the last 24 hours",
                labels=["task"],
            ),
            "failures": GaugeMetricFamily(
                "shareframe_celery_task_failures_24h",
                "Failed runs of the task in the last 24 hours",
                labels=["task"],
            ),
        }
        for row in rows:
            task = [row["task_name"]]
            for field in ("last_success", "last_failure"):
                if row[field] is not None:
                    families[field].add_metric(task, row[field].timestamp())
            families["runs"].add_metric(task, row["runs"])
            families["failures"].add_metric(task, row["failures"])
        yield from families.values()

    def _collect_broker(self):
        from config.celeryconfig import broker_url

        client = redis.Redis.from_url(
            broker_url, socket_timeout=2, socket_connect_timeout=2
        )
        try:
            yield _gauge(
                "shareframe_celery_queue_length",
                "Tasks waiting in the default Celery queue",
                client.llen("celery"),
            )
            info = client.info()
        finally:
            client.close()
        for name, field, documentation in _REDIS_INFO:
            if field in info:
                yield _gauge(name, documentation, info[field])
