from django.test import RequestFactory

from utils.client_location import client_location


def wire(value):
    return value.encode("utf-8").decode("latin-1")


def test_prefers_the_city():
    request = RequestFactory().get(
        "/", HTTP_X_GEOIP_CITY="Musterstadt", HTTP_X_GEOIP_COUNTRY="Musterland"
    )

    assert client_location(request) == "Musterstadt"


def test_falls_back_to_the_country():
    request = RequestFactory().get(
        "/", HTTP_X_GEOIP_CITY="unknown", HTTP_X_GEOIP_COUNTRY="Musterland"
    )

    assert client_location(request) == "Musterland"


def test_decodes_utf8_sent_by_nginx():
    request = RequestFactory().get("/", HTTP_X_GEOIP_CITY=wire("Größstadt"))

    assert client_location(request) == "Größstadt"


def test_none_when_nothing_is_known():
    request = RequestFactory().get("/", HTTP_X_GEOIP_CITY="unknown")

    assert client_location(request) is None


def test_none_without_a_request():
    assert client_location(None) is None
