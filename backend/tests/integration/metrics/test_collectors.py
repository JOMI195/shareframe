from datetime import timedelta

import pytest
from django.utils import timezone
from django_celery_results.models import TaskResult

from images.models import Image
from metrics.collectors import (
    ShareframeBusinessCollector,
    ShareframeCeleryCollector,
    ShareframeFrameCollector,
)
from sent_images.models import SentImage
from tests.support.factories import FrameFactory, ImageFactory, SentImageFactory
from user_core.models import User

pytestmark = pytest.mark.django_db


def gauges(collector):
    return {
        metric.name: metric.samples[0].value
        for metric in collector.collect()
        if metric.samples
    }


def series(collector, name):
    for metric in collector.collect():
        if metric.name == name:
            return metric.samples
    return []


class TestBusinessCollector:
    def test_counts_stored_images(self):
        values = gauges(ShareframeBusinessCollector())

        assert (
            values["shareframe_images_total"]
            == Image.objects.filter(markedAsDeleted=False).count()
        )

    def test_soft_deleted_images_are_counted_separately(self):
        ImageFactory(markedAsDeleted=True)

        values = gauges(ShareframeBusinessCollector())

        assert (
            values["shareframe_images_marked_deleted_total"]
            == Image.objects.filter(markedAsDeleted=True).count()
        )

    def test_storage_bytes_covers_originals_and_variants(self):
        originals = sum(
            Image.objects.filter(markedAsDeleted=False).values_list("size", flat=True)
        )

        values = gauges(ShareframeBusinessCollector())

        assert values["shareframe_images_storage_bytes"] > originals

    def test_storage_bytes_include_images_marked_for_deletion(self):
        before = gauges(ShareframeBusinessCollector())[
            "shareframe_images_storage_bytes"
        ]
        image = ImageFactory(markedAsDeleted=True)

        after = gauges(ShareframeBusinessCollector())["shareframe_images_storage_bytes"]

        assert after > before + image.size

    def test_counts_the_users(self):
        values = gauges(ShareframeBusinessCollector())

        assert values["shareframe_users_total"] == User.objects.count()

    def test_a_deleted_user_drops_out(self):
        before = gauges(ShareframeBusinessCollector())["shareframe_users_total"]
        User.objects.get(username="seed_bob").delete()

        after = gauges(ShareframeBusinessCollector())["shareframe_users_total"]

        assert after == before - 1

    def test_counts_sent_images_and_the_expired_share(self):
        SentImageFactory(expired=True)

        values = gauges(ShareframeBusinessCollector())

        assert (
            values["shareframe_sent_images_total"] == SentImage.objects.sent().count()
        )
        assert values["shareframe_sent_images_expired"] >= 1

    def test_a_broken_query_does_not_raise(self, monkeypatch):
        """collect() swallows failures so a scrape never 500s."""
        monkeypatch.setattr(
            ShareframeBusinessCollector,
            "_collect",
            lambda self: (_ for _ in ()).throw(RuntimeError("boom")),
        )

        assert list(ShareframeBusinessCollector().collect()) == []

    def test_counts_scheduled_sent_images_apart_from_delivered_ones(self):
        before = gauges(ShareframeBusinessCollector())
        SentImageFactory(scheduled=True)

        after = gauges(ShareframeBusinessCollector())

        assert (
            after["shareframe_sent_images_scheduled"]
            == SentImage.objects.scheduled().count()
        )
        assert (
            after["shareframe_sent_images_total"]
            == before["shareframe_sent_images_total"]
        )


class TestFrameCollector:
    def test_reports_one_info_series_per_frame(self):
        from frames.models import Frame

        samples = series(ShareframeFrameCollector(), "shareframe_frame_info")

        assert len(samples) == Frame.objects.count()

    def test_the_series_are_labelled_with_the_serial(self):
        from frames.models import Frame

        samples = series(ShareframeFrameCollector(), "shareframe_frame_info")
        serials = {sample.labels["serial_number"] for sample in samples}

        assert serials == set(
            Frame.objects.values_list("public_serial_number", flat=True)
        )

    def test_a_broken_query_does_not_raise(self, monkeypatch):
        monkeypatch.setattr(
            ShareframeFrameCollector,
            "_collect",
            lambda self: (_ for _ in ()).throw(RuntimeError("boom")),
        )

        assert list(ShareframeFrameCollector().collect()) == []

    def test_update_timestamps_are_exported_per_frame(self):
        checked = timezone.now()
        frame = FrameFactory(last_update_check=checked)

        def values(name):
            return [
                s.value
                for s in series(ShareframeFrameCollector(), name)
                if s.labels["serial_number"] == frame.public_serial_number
            ]

        assert values("shareframe_frame_last_update_check_timestamp_seconds") == [
            checked.timestamp()
        ]
        assert values("shareframe_frame_last_update_attempt_timestamp_seconds") == []

    def test_fresh_telemetry_is_exported_per_frame(self):
        frame = FrameFactory(
            last_heartbeat=timezone.now(), last_telemetry={"cpu_temp_celsius": 48.5}
        )

        samples = series(
            ShareframeFrameCollector(), "shareframe_frame_cpu_temp_celsius"
        )

        assert [
            s.value
            for s in samples
            if s.labels["serial_number"] == frame.public_serial_number
        ] == [48.5]

    def test_a_silent_frame_exports_no_telemetry(self):
        """Its last snapshot would otherwise read as a live, healthy frame."""
        frame = FrameFactory(
            last_heartbeat=timezone.now() - timedelta(hours=1),
            last_telemetry={"cpu_temp_celsius": 48.5},
        )

        samples = series(
            ShareframeFrameCollector(), "shareframe_frame_cpu_temp_celsius"
        )

        assert frame.public_serial_number not in {
            s.labels["serial_number"] for s in samples
        }

    def test_websocket_traffic_does_not_refresh_telemetry(self):
        """Only a heartbeat delivers telemetry, so only a heartbeat keeps it fresh."""
        frame = FrameFactory(
            last_seen=timezone.now(),
            last_heartbeat=timezone.now() - timedelta(hours=1),
            last_telemetry={"cpu_temp_celsius": 48.5},
        )

        samples = series(
            ShareframeFrameCollector(), "shareframe_frame_cpu_temp_celsius"
        )

        assert frame.public_serial_number not in {
            s.labels["serial_number"] for s in samples
        }


class TestUsageGauges:
    def test_counts_uploads_of_the_last_day(self):
        before = gauges(ShareframeBusinessCollector())["shareframe_images_uploaded_24h"]
        ImageFactory()

        after = gauges(ShareframeBusinessCollector())["shareframe_images_uploaded_24h"]

        assert after == before + 1

    def test_active_users_are_reported_per_window(self):
        samples = series(ShareframeBusinessCollector(), "shareframe_users_active")

        assert {s.labels["window"] for s in samples} == {"1d", "7d", "30d"}

    def test_windows_nest(self):
        User.objects.filter(username="seed_bob").update(last_login=timezone.now())

        active = {
            s.labels["window"]: s.value
            for s in series(ShareframeBusinessCollector(), "shareframe_users_active")
        }

        assert 1 <= active["1d"] <= active["7d"] <= active["30d"]

    def test_reports_the_database_size(self):
        assert (
            gauges(ShareframeBusinessCollector())["shareframe_database_size_bytes"] > 0
        )


class TestCeleryCollector:
    @pytest.fixture(autouse=True)
    def no_broker(self, monkeypatch):
        monkeypatch.setattr(
            ShareframeCeleryCollector, "_collect_broker", lambda self: iter(())
        )

    def result(self, status, **kwargs):
        return TaskResult.objects.create(
            task_id=f"{status}-{TaskResult.objects.count()}",
            task_name="tests.task",
            status=status,
            date_done=timezone.now(),
            **kwargs,
        )

    def samples(self, name):
        return {
            s.labels["task"]: s.value for s in series(ShareframeCeleryCollector(), name)
        }

    def test_reports_the_last_success_per_task(self):
        done = self.result("SUCCESS")

        samples = self.samples("shareframe_celery_task_last_success_timestamp_seconds")

        assert samples["tests.task"] == pytest.approx(done.date_done.timestamp())

    def test_counts_runs_and_failures_of_the_last_day(self):
        self.result("SUCCESS")
        self.result("FAILURE")
        self.result("FAILURE")

        assert self.samples("shareframe_celery_task_runs_24h")["tests.task"] == 3
        assert self.samples("shareframe_celery_task_failures_24h")["tests.task"] == 2

    def test_a_task_that_never_failed_has_no_failure_timestamp(self):
        self.result("SUCCESS")

        assert "tests.task" not in self.samples(
            "shareframe_celery_task_last_failure_timestamp_seconds"
        )

    def test_a_broken_broker_keeps_the_task_metrics(self, monkeypatch):
        def broken(self):
            raise ConnectionError("redis down")
            yield

        monkeypatch.setattr(ShareframeCeleryCollector, "_collect_broker", broken)
        self.result("SUCCESS")

        assert "tests.task" in self.samples("shareframe_celery_task_runs_24h")
