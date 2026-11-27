import pytest

from notifications.push_endpoints import is_push_service_url


@pytest.mark.parametrize(
    "url",
    [
        "https://fcm.googleapis.com/fcm/send/abc",
        "https://updates.push.services.mozilla.com/wpush/v2/abc",
        "https://wns2-par02p.notify.windows.com/w/?token=abc",
        "https://web.push.apple.com/abc",
        "https://fcm.googleapis.com:443/fcm/send/abc",
    ],
)
def test_browser_push_services_pass(url):
    assert is_push_service_url(url)


@pytest.mark.parametrize(
    "url",
    [
        "http://fcm.googleapis.com/fcm/send/abc",
        "https://fcm.googleapis.com:8443/fcm/send/abc",
        "https://backend:8000/api/metrics/",
        "https://127.0.0.1/abc",
        "https://evilfcm.googleapis.com.example.com/abc",
        "https://notfcm.googleapis.com/abc",
        "https://fcm.googleapis.com@internal/abc",
        "https://[::1/abc",
        "",
        None,
    ],
)
def test_anything_else_is_refused(url):
    assert not is_push_service_url(url)
