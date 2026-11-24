from celery.signals import beat_init, worker_ready
from prometheus_client import REGISTRY

from metrics import celery_exporter


def test_nothing_is_served_without_a_port(monkeypatch):
    monkeypatch.delenv("PROMETHEUS_METRICS_PORT", raising=False)
    before = len(worker_ready.receivers), len(beat_init.receivers)

    celery_exporter.connect()

    assert (len(worker_ready.receivers), len(beat_init.receivers)) == before


def test_the_process_registry_is_served_on_the_configured_port(monkeypatch):
    monkeypatch.setenv("PROMETHEUS_METRICS_PORT", "9808")
    monkeypatch.delenv("PROMETHEUS_MULTIPROC_DIR", raising=False)
    calls = []
    monkeypatch.setattr(
        celery_exporter,
        "start_http_server",
        lambda port, registry: calls.append((port, registry)),
    )

    celery_exporter._serve()

    assert calls == [(9808, REGISTRY)]
