from django.apps import AppConfig
from prometheus_client import REGISTRY


class MetricsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "metrics"

    def ready(self):
        from .collectors import ShareframeBusinessCollector

        already_registered = any(
            isinstance(c, ShareframeBusinessCollector)
            for c in list(REGISTRY._collector_to_names)
        )
        if not already_registered:
            REGISTRY.register(ShareframeBusinessCollector())
