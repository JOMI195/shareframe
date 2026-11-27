from django.http import HttpResponse
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from utils.request_logging.decorators import no_logging

from .registry import APP_REGISTRY, BUSINESS_REGISTRY, process_registry


def _render(*registries):
    body = b"".join(generate_latest(r) for r in registries)
    return HttpResponse(body, content_type=CONTENT_TYPE_LATEST)


@no_logging(value=True, silent=True)
def metrics_view(request):
    return _render(process_registry(), APP_REGISTRY)


@no_logging(value=True, silent=True)
def process_metrics_view(request):
    return _render(process_registry())


@no_logging(value=True, silent=True)
def business_metrics_view(request):
    return _render(BUSINESS_REGISTRY)
