from django.apps import AppConfig


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
        from .collectors import (
            ShareframeAuthCollector,
            ShareframeBusinessCollector,
            ShareframeCeleryCollector,
            ShareframeFrameCollector,
        )
        from .registry import APP_REGISTRY, BUSINESS_REGISTRY

        _register(APP_REGISTRY, ShareframeFrameCollector())
        _register(APP_REGISTRY, ShareframeCeleryCollector())
        _register(BUSINESS_REGISTRY, ShareframeBusinessCollector())
        _register(BUSINESS_REGISTRY, ShareframeAuthCollector())
