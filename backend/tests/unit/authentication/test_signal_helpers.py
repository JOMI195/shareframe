from django.test import RequestFactory

from authentication.signals import _is_admin_request


def test_recognises_an_admin_path():
    assert _is_admin_request(RequestFactory().get("/api/admin/login/"))


def test_an_api_path_is_not_an_admin_path():
    assert not _is_admin_request(RequestFactory().get("/api/auth/jwt/create/"))


def test_no_request_is_not_an_admin_request():
    assert not _is_admin_request(None)
