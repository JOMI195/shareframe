from django.http import HttpResponse
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from .registry import APP_REGISTRY, BUSINESS_REGISTRY, process_registry


def _render(*registries):
    body = b"".join(generate_latest(r) for r in registries)
    return HttpResponse(body, content_type=CONTENT_TYPE_LATEST)


def metrics_view(request):
    return _render(process_registry(), APP_REGISTRY)


def process_metrics_view(request):
    return _render(process_registry())


def business_metrics_view(request):
    return _render(BUSINESS_REGISTRY)
