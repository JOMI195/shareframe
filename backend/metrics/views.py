from django.http import HttpResponse
from prometheus_client import CONTENT_TYPE_LATEST, REGISTRY, generate_latest

from .registry import BUSINESS_REGISTRY


def _render(registry):
    return HttpResponse(generate_latest(registry), content_type=CONTENT_TYPE_LATEST)


def metrics_view(request):
    return _render(REGISTRY)


def business_metrics_view(request):
    return _render(BUSINESS_REGISTRY)
