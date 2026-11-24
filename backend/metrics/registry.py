import os

from prometheus_client import REGISTRY, CollectorRegistry
from prometheus_client.multiprocess import MultiProcessCollector

# Scraped on its own slower endpoint, so the DB pass it does stays off the hot path.
BUSINESS_REGISTRY = CollectorRegistry()

# Read from DB/Redis, so only one process may export them or series double.
APP_REGISTRY = CollectorRegistry()


def process_registry():
    """This process' own metrics, merged across workers when they share a multiproc dir."""
    path = os.environ.get("PROMETHEUS_MULTIPROC_DIR")
    if not path:
        return REGISTRY
    registry = CollectorRegistry()
    MultiProcessCollector(registry, path=path)
    return registry
