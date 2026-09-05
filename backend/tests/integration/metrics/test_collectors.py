import pytest

from images.models import Image
from metrics.collectors import ShareframeBusinessCollector, ShareframeFrameCollector
from sent_images.models import SentImage
from tests.support.factories import ImageFactory, SentImageFactory
from user_core.models import User

pytestmark = pytest.mark.django_db


def gauges(collector):
    return {metric.name: metric.samples[0].value for metric in collector.collect() if metric.samples}


def series(collector, name):
    for metric in collector.collect():
        if metric.name == name:
            return metric.samples
    return []


class TestBusinessCollector:
    def test_counts_stored_images(self):
        values = gauges(ShareframeBusinessCollector())

        assert values["shareframe_images_total"] == Image.objects.filter(
            markedAsDeleted=False
        ).count()

    def test_soft_deleted_images_are_counted_separately(self):
        ImageFactory(markedAsDeleted=True)

        values = gauges(ShareframeBusinessCollector())

        assert values["shareframe_images_marked_deleted_total"] == Image.objects.filter(
            markedAsDeleted=True
        ).count()

    def test_storage_bytes_covers_originals_and_variants(self):
        originals = sum(
            Image.objects.filter(markedAsDeleted=False).values_list("size", flat=True)
        )

        values = gauges(ShareframeBusinessCollector())

        assert values["shareframe_images_storage_bytes"] > originals

    def test_counts_live_users(self):
        values = gauges(ShareframeBusinessCollector())

        assert values["shareframe_users_total"] == User.objects.filter(
            is_deleted=False
        ).count()

    def test_a_deleted_user_drops_out(self):
        before = gauges(ShareframeBusinessCollector())["shareframe_users_total"]
        User.objects.get(username="seed_bob").delete()

        after = gauges(ShareframeBusinessCollector())["shareframe_users_total"]

        assert after == before - 1

    def test_counts_sent_images_and_the_expired_share(self):
        SentImageFactory(expired=True)

        values = gauges(ShareframeBusinessCollector())

        assert values["shareframe_sent_images_total"] == SentImage.objects.count()
        assert values["shareframe_sent_images_expired"] >= 1

    def test_a_broken_query_does_not_raise(self, monkeypatch):
        """collect() swallows failures so a scrape never 500s."""
        monkeypatch.setattr(
            ShareframeBusinessCollector,
            "_collect",
            lambda self: (_ for _ in ()).throw(RuntimeError("boom")),
        )

        assert list(ShareframeBusinessCollector().collect()) == []


class TestFrameCollector:
    def test_reports_one_info_series_per_frame(self):
        from frames.models import Frame

        samples = series(ShareframeFrameCollector(), "shareframe_frame_info")

        assert len(samples) == Frame.objects.count()

    def test_the_series_are_labelled_with_the_serial(self):
        from frames.models import Frame

        samples = series(ShareframeFrameCollector(), "shareframe_frame_info")
        serials = {sample.labels["serial_number"] for sample in samples}

        assert serials == set(Frame.objects.values_list("public_serial_number", flat=True))

    def test_a_broken_query_does_not_raise(self, monkeypatch):
        monkeypatch.setattr(
            ShareframeFrameCollector,
            "_collect",
            lambda self: (_ for _ in ()).throw(RuntimeError("boom")),
        )

        assert list(ShareframeFrameCollector().collect()) == []
