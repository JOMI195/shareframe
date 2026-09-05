from django.conf import settings
from django.http import HttpResponse
from django.test import RequestFactory

from utils.upload_limits.middleware import UploadSizeLimitMiddleware

OK = HttpResponse("passed through")


def build(path, content_length):
    request = RequestFactory().post(path)
    if content_length is not None:
        request.META["CONTENT_LENGTH"] = content_length
    else:
        request.META.pop("CONTENT_LENGTH", None)
    return UploadSizeLimitMiddleware(lambda _: OK)(request)


def test_lets_a_small_app_request_through():
    assert build("/api/images/", 1024) is OK


def test_rejects_an_app_request_over_the_app_limit():
    response = build("/api/images/", settings.APP_UPLOAD_MAX_SIZE + 1)

    assert response.status_code == 413


def test_allows_exactly_the_app_limit():
    assert build("/api/images/", settings.APP_UPLOAD_MAX_SIZE) is OK


def test_the_admin_gets_the_higher_ceiling():
    """Firmware releases are uploaded through the admin."""
    over_app = settings.APP_UPLOAD_MAX_SIZE + 1

    assert build(settings.ADMIN_URL_PREFIX + "frame_updates/release/add/", over_app) is OK


def test_rejects_an_admin_request_over_the_admin_limit():
    response = build(
        settings.ADMIN_URL_PREFIX + "frame_updates/release/add/",
        settings.ADMIN_UPLOAD_MAX_SIZE + 1,
    )

    assert response.status_code == 413


def test_a_missing_content_length_is_not_checked():
    assert build("/api/images/", None) is OK


def test_an_empty_content_length_is_not_checked():
    assert build("/api/images/", "") is OK
