import pytest

pytestmark = pytest.mark.django_db

METRICS_URL = "/metrics"
PROCESS_URL = "/metrics/process"
BUSINESS_URL = "/metrics/business"


def test_the_prometheus_endpoint_is_open(client):
    """Not exposed through nginx, so it carries no auth of its own."""
    response = client.get(METRICS_URL)

    assert response.status_code == 200
    assert "text/plain" in response["Content-Type"]


def test_the_business_endpoint_is_open(client):
    assert client.get(BUSINESS_URL).status_code == 200


def test_the_business_endpoint_carries_the_business_gauges(client):
    body = client.get(BUSINESS_URL).content.decode()

    assert "shareframe_images_total" in body
    assert "shareframe_users_total" in body
    assert "shareframe_sent_images_total" in body
    assert "shareframe_sent_images_scheduled" in body
    assert "shareframe_auth_sessions_active" in body


def test_the_main_endpoint_carries_the_roster_but_no_business_gauges(client):
    body = client.get(METRICS_URL).content.decode()

    assert "shareframe_frame_info" in body
    assert "shareframe_images_total" not in body


def test_the_process_endpoint_carries_only_the_process_metrics(client):
    """daphne and celery serve it too, so the fleet roster must not appear twice."""
    client.get(METRICS_URL)
    body = client.get(PROCESS_URL).content.decode()

    assert "django_http_requests_total_by_method_total" in body
    assert "shareframe_frame_info" not in body


def test_the_roster_names_every_frame(client):
    from frames.models import Frame

    body = client.get(METRICS_URL).content.decode()

    for serial in Frame.objects.values_list("public_serial_number", flat=True):
        assert serial in body


# Prometheus scrapes plain HTTP inside the container network.
@pytest.mark.parametrize("url", [METRICS_URL, BUSINESS_URL, PROCESS_URL])
def test_is_exempt_from_the_https_redirect(client, settings, url):
    settings.SECURE_SSL_REDIRECT = True

    assert client.get(url).status_code == 200
