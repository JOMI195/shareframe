import multiprocessing
import os
from pathlib import Path

worker_class = "gthread"
workers = max(2, multiprocessing.cpu_count())
threads = 4
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
