import json
import logging

from django.http import HttpResponse
from django.test import RequestFactory

from utils.request_logging.decorators import no_logging
from utils.request_logging.middleware import (
    LOG_BODY_ATTR,
    NO_BODY_LOGGING_MSG_ATTR,
    NO_LOGGING_ATTR,
    NO_LOGGING_MSG,
    NO_LOGGING_MSG_ATTR,
    LoggingMiddleware,
)


def test_suppression_needs_an_explicit_value():
    """Bare @no_logging() writes the default (False) — it does not suppress."""

    @no_logging()
    def bare():
        pass

    @no_logging(value=True)
    def explicit():
        pass

    assert getattr(bare, NO_LOGGING_ATTR) is False
    assert getattr(explicit, NO_LOGGING_ATTR) is True


def test_the_default_message_is_attached():
    @no_logging()
    def view():
        pass

    assert getattr(view, NO_LOGGING_MSG_ATTR) == NO_LOGGING_MSG


def test_a_custom_message_replaces_the_default():
    @no_logging("secrets in here")
    def view():
        pass

    assert getattr(view, NO_LOGGING_MSG_ATTR) == "secrets in here"


def test_silent_drops_the_message():
    @no_logging("ignored", silent=True)
    def view():
        pass

    assert getattr(view, NO_LOGGING_MSG_ATTR) is None


def test_body_logging_can_be_turned_off_on_its_own():
    @no_logging(log_body=False, no_body_logging_msg="body hidden")
    def view():
        pass

    assert getattr(view, LOG_BODY_ATTR) is False
    assert getattr(view, NO_BODY_LOGGING_MSG_ATTR) == "body hidden"


def test_returns_the_same_function():
    def view():
        pass

    assert no_logging()(view) is view


LOGIN_PATH = "/api/auth/jwt/create/"


def logged(caplog, request):
    with caplog.at_level(logging.DEBUG, logger="django.request"):
        LoggingMiddleware(lambda r: HttpResponse())(request)
    return caplog.text


class TestRedaction:
    def test_json_secrets_are_masked(self, caplog):
        request = RequestFactory().post(
            LOGIN_PATH,
            json.dumps({"email": "user@shareframe.local", "password": "hunter2-pass"}),
            content_type="application/json",
        )

        text = logged(caplog, request)

        assert "hunter2-pass" not in text
        assert "user@shareframe.local" in text

    def test_nested_json_secrets_are_masked(self, caplog):
        body = {"items": [{"new_password": "nested-secret1", "name": "kept-name"}]}
        request = RequestFactory().post(
            LOGIN_PATH, json.dumps(body), content_type="application/json"
        )

        text = logged(caplog, request)

        assert "nested-secret1" not in text
        assert "kept-name" in text

    def test_telemetry_keys_resembling_secrets_are_kept(self, caplog):
        body = {
            "serial_number": "TEST-0001",
            "epd_refresh_total": 4711,
            "epd_last_refresh_ms": 2345,
            "status_code": 418,
            "authenticated": "kept-flag",
        }
        request = RequestFactory().post(
            "/api/frames/frame-hearbeat/",
            json.dumps(body),
            content_type="application/json",
        )

        text = logged(caplog, request)

        for value in ("TEST-0001", "4711", "2345", "418", "kept-flag"):
            assert value in text

    def test_a_long_json_body_is_masked_before_truncation(self, caplog, settings):
        settings.REQUEST_LOGGING_MAX_BODY_LENGTH = 40
        request = RequestFactory().post(
            LOGIN_PATH,
            json.dumps({"password": "truncated-secret1", "padding": "x" * 30}),
            content_type="application/json",
        )

        text = logged(caplog, request)

        assert "truncated-secret1" not in text
        assert "padding" in text

    def test_form_encoded_secrets_are_masked(self, caplog):
        request = RequestFactory().post(
            "/api/admin/login/",
            "username=admin%40shareframe.local&password=form-secret1&otp_token=123456",
            content_type="application/x-www-form-urlencoded",
        )

        text = logged(caplog, request)

        assert "form-secret1" not in text
        assert "123456" not in text
        assert "admin%40shareframe.local" in text

    def test_multipart_text_secrets_are_masked(self, caplog):
        request = RequestFactory().post(
            "/api/admin/login/",
            {"username": "multi-user", "password": "multipart-secret1"},
        )

        text = logged(caplog, request)

        assert "multipart-secret1" not in text
        assert "multi-user" in text

    def test_cookies_and_the_csrf_header_are_masked(self, caplog):
        request = RequestFactory().get(
            "/api/version/",
            HTTP_COOKIE="access=cookie-jwt-value; csrftoken=cookie-csrf-value",
            HTTP_X_CSRFTOKEN="header-csrf-value",
        )

        text = logged(caplog, request)

        assert "cookie-jwt-value" not in text
        assert "cookie-csrf-value" not in text
        assert "header-csrf-value" not in text

    def test_query_string_secrets_are_masked(self, caplog):
        request = RequestFactory().get(
            "/api/version/", {"token": "query-secret1", "page": "2"}
        )

        text = logged(caplog, request)

        assert "query-secret1" not in text
        assert "page=2" in text
