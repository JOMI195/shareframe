import multiprocessing
import os
from pathlib import Path

worker_class = "gthread"
# cpu_count sees the host, not the container; with persistent DB connections each thread holds one.
workers = int(os.environ.get("GUNICORN_WORKERS", max(2, multiprocessing.cpu_count())))
threads = 4
# Recycles workers so memory Pillow leaves behind does not pile up.
max_requests = 1000
max_requests_jitter = 100
timeout = 120
graceful_timeout = 30
# Unused, and $HOME is not writable for the app user.
control_socket_disable = True

_metrics_dir = os.environ.get("PROMETHEUS_MULTIPROC_DIR")


def on_starting(server):
    # Drops what the entrypoint's manage.py runs left behind.
    if _metrics_dir:
        for f in Path(_metrics_dir).glob("*.db"):
            f.unlink()


def child_exit(server, worker):
    if _metrics_dir:
        from prometheus_client import multiprocess

        multiprocess.mark_process_dead(worker.pid, _metrics_dir)
