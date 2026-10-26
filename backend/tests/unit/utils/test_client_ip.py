from django.test import RequestFactory

from utils.client_ip import client_ip


def test_prefers_the_first_forwarded_hop():
    request = RequestFactory().get("/", HTTP_X_FORWARDED_FOR="203.0.113.5, 10.0.0.1")

    assert client_ip(request) == "203.0.113.5"


def test_strips_whitespace_around_the_hop():
    request = RequestFactory().get("/", HTTP_X_FORWARDED_FOR="  203.0.113.5  ")

    assert client_ip(request) == "203.0.113.5"


def test_falls_back_to_remote_addr():
    request = RequestFactory().get("/", REMOTE_ADDR="198.51.100.9")

    assert client_ip(request) == "198.51.100.9"


def test_reports_unknown_when_there_is_no_address():
    request = RequestFactory().get("/")
    request.META.pop("REMOTE_ADDR", None)

    assert client_ip(request) == "unknown"


def test_reports_unknown_without_a_request():
    assert client_ip(None) == "unknown"
