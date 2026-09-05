import pytest

pytestmark = pytest.mark.django_db

METRICS_URL = "/metrics"
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


def test_the_fleet_roster_lives_on_the_default_registry(client):
    """The frame collector is registered on REGISTRY, the business one is not."""
    body = client.get(METRICS_URL).content.decode()

    assert "shareframe_frame_info" in body
    assert "shareframe_images_total" not in body


def test_the_roster_names_every_frame(client):
    from frames.models import Frame

    body = client.get(METRICS_URL).content.decode()

    for serial in Frame.objects.values_list("public_serial_number", flat=True):
        assert serial in body
