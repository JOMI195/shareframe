import logging

from django.http import Http404, JsonResponse
from rest_framework import exceptions

logger = logging.getLogger("django.security.csrf")

CSRF_FAILED_DETAIL = "CSRF Failed: Request rejected."


def _error(status, detail):
    return JsonResponse({"detail": detail}, status=status)


def bad_request(request, exception=None):
    return _error(400, "Bad request.")


def permission_denied(request, exception=None):
    return _error(403, "You do not have permission to perform this action.")


def page_not_found(request, exception=None):
    return _error(404, "Not found.")


def server_error(request):
    return _error(500, "A server error occurred.")


def request_too_large():
    return _error(413, "Request entity too large.")


def csrf_failure(request, reason=""):
    logger.warning("CSRF failed on %s %s: %s", request.method, request.path, reason)
    return _error(403, CSRF_FAILED_DETAIL)


def exception_handler(exc, context):
    # Imported here: authentication.auth loads this module before DRF's views.
    from rest_framework.views import exception_handler as drf_exception_handler

    # DRF forwards Http404 args, which name the model.
    if isinstance(exc, Http404):
        exc = exceptions.NotFound()
    response = drf_exception_handler(exc, context)
    if response is not None and isinstance(exc, exceptions.APIException):
        codes = exc.get_codes()
        if isinstance(codes, str) and isinstance(response.data, dict):
            response.data["code"] = codes
    return response
