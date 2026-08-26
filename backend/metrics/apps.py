from django.apps import AppConfig
from prometheus_client import REGISTRY


def _register(registry, collector):
    already_registered = any(
        isinstance(c, type(collector)) for c in list(registry._collector_to_names)
    )
    if not already_registered:
        registry.register(collector)


class MetricsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "metrics"

    def ready(self):
        from .collectors import ShareframeBusinessCollector, ShareframeFrameCollector
        from .registry import BUSINESS_REGISTRY

        _register(REGISTRY, ShareframeFrameCollector())
        _register(BUSINESS_REGISTRY, ShareframeBusinessCollector())
