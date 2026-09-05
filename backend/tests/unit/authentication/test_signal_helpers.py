from django.test import RequestFactory

from authentication.signals import _get_client_ip, _is_admin_request


def test_prefers_the_first_forwarded_hop():
    request = RequestFactory().get("/", HTTP_X_FORWARDED_FOR="203.0.113.5, 10.0.0.1")

    assert _get_client_ip(request) == "203.0.113.5"


def test_strips_whitespace_around_the_hop():
    request = RequestFactory().get("/", HTTP_X_FORWARDED_FOR="  203.0.113.5  ")

    assert _get_client_ip(request) == "203.0.113.5"


def test_falls_back_to_remote_addr():
    request = RequestFactory().get("/", REMOTE_ADDR="198.51.100.9")

    assert _get_client_ip(request) == "198.51.100.9"


def test_reports_unknown_when_there_is_no_address():
    request = RequestFactory().get("/")
    request.META.pop("REMOTE_ADDR", None)

    assert _get_client_ip(request) == "unknown"


def test_recognises_an_admin_path():
    assert _is_admin_request(RequestFactory().get("/api/admin/login/"))


def test_an_api_path_is_not_an_admin_path():
    assert not _is_admin_request(RequestFactory().get("/api/auth/jwt/create/"))


def test_no_request_is_not_an_admin_request():
    assert not _is_admin_request(None)
