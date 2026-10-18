from unittest.mock import patch

from prometheus_client import CollectorRegistry

from metrics.collectors import (
    ShareframeCeleryCollector,
    ShareframeFrameCollector,
    telemetry_samples,
)


def test_registering_on_an_auto_describing_registry_does_not_collect():
    collector = ShareframeFrameCollector()

    with patch.object(collector, "collect") as collect:
        CollectorRegistry(auto_describe=True).register(collector)

    collect.assert_not_called()


class TestTelemetrySamples:
    def samples(self, telemetry):
        return {
            (name, tuple(sorted(labels.items()))): value
            for name, labels, value in telemetry_samples(telemetry)
        }

    def test_allowlisted_numbers_become_gauges(self):
        samples = self.samples(
            {"cpu_temp_celsius": 51.5, "wlan_connected": True, "image_count": 12}
        )

        assert samples[("shareframe_frame_cpu_temp_celsius", ())] == 51.5
        assert samples[("shareframe_frame_wlan_connected", ())] == 1
        assert samples[("shareframe_frame_image_count", ())] == 12

    def test_unknown_keys_and_non_numbers_are_dropped(self):
        samples = self.samples(
            {"hostname": "frame", "local_ip_address": "10.0.0.2", "foo_bar": 3}
        )

        assert {name for name, _ in samples} == {
            "shareframe_frame_safe_mode",
            "shareframe_frame_build_info",
        }

    def test_service_flags_carry_the_service(self):
        samples = self.samples({"display_running": False, "update_running": True})

        assert (
            samples[("shareframe_frame_service_running", (("service", "display"),))]
            == 0
        )
        assert (
            samples[("shareframe_frame_service_running", (("service", "update"),))] == 1
        )

    def test_process_keys_split_into_service_and_metric(self):
        samples = self.samples({"proc_display_rss_bytes": 1024, "proc_evil_fds": 3})

        assert (
            samples[("shareframe_frame_process_rss_bytes", (("service", "display"),))]
            == 1024
        )
        assert not any(name.endswith("_fds") for name, _ in samples)

    def test_display_stats_are_prefixed(self):
        samples = self.samples({"display_epd_last_refresh_ms": 4200})

        assert samples[("shareframe_frame_display_epd_last_refresh_ms", ())] == 4200

    def test_health_strings_become_check_status_pairs(self):
        samples = self.samples(
            {"health_state": "warn", "health_temp": "ok", "display_health": "failed"}
        )

        health = {
            labels: value
            for (name, labels), value in samples.items()
            if name == "shareframe_frame_health"
        }
        assert health == {
            (("check", "overall"), ("status", "warn")): 1,
            (("check", "temp"), ("status", "ok")): 1,
            (("check", "display"), ("status", "failed")): 1,
        }

    def test_safe_mode_reason_is_a_label(self):
        assert (
            self.samples({"safe_mode": "display-crash"})[
                ("shareframe_frame_safe_mode", (("reason", "display-crash"),))
            ]
            == 1
        )
        assert self.samples({})[("shareframe_frame_safe_mode", (("reason", ""),))] == 0

    def test_build_info_always_carries_every_label(self):
        samples = self.samples({"version": "8.0.0", "boot_slot": "A"})

        (labels,) = [
            dict(labels)
            for name, labels in samples
            if name == "shareframe_frame_build_info"
        ]
        assert labels == {
            "version": "8.0.0",
            "app_sha": "",
            "os_sha": "",
            "kernel": "",
            "boot_slot": "A",
            "sd_card": "",
        }


class FakeRedis:
    def __init__(self, info):
        self._info = info
        self.closed = False

    def llen(self, key):
        return 4 if key == "celery" else 0

    def info(self):
        return self._info

    def close(self):
        self.closed = True


class TestBrokerGauges:
    def test_reports_queue_length_and_redis_memory(self, monkeypatch):
        fake = FakeRedis({"used_memory": 100, "maxmemory": 512, "evicted_keys": 2})
        monkeypatch.setattr(
            "metrics.collectors.redis.Redis.from_url", lambda *a, **kw: fake
        )

        values = {
            m.name: m.samples[0].value
            for m in ShareframeCeleryCollector()._collect_broker()
        }

        assert values == {
            "shareframe_celery_queue_length": 4,
            "shareframe_redis_used_memory_bytes": 100,
            "shareframe_redis_maxmemory_bytes": 512,
            "shareframe_redis_evicted_keys_total": 2,
        }
        assert fake.closed
