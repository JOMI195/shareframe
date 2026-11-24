import os

from celery.signals import beat_init, worker_process_shutdown, worker_ready
from prometheus_client import start_http_server

from .registry import process_registry


def _serve(**kwargs):
    start_http_server(
        int(os.environ["PROMETHEUS_METRICS_PORT"]), registry=process_registry()
    )


def _forget_child(**kwargs):
    from prometheus_client import multiprocess

    multiprocess.mark_process_dead(os.getpid())


def connect():
    if not os.environ.get("PROMETHEUS_METRICS_PORT"):
        return
    # After the pool forked, so children don't inherit the listening socket.
    worker_ready.connect(_serve, weak=False)
    beat_init.connect(_serve, weak=False)
    if os.environ.get("PROMETHEUS_MULTIPROC_DIR"):
        worker_process_shutdown.connect(_forget_child, weak=False)
