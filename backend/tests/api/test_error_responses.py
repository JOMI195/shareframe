import pytest

pytestmark = pytest.mark.django_db


def test_an_unknown_route_is_a_json_404(client):
    response = client.get("/api/does-not-exist/")

    assert response.status_code == 404
    assert response.json() == {"detail": "Not found."}


def test_a_disallowed_host_is_a_json_400(client):
    response = client.get("/api/version/", HTTP_HOST="evil.example")

    assert response.status_code == 400
    assert response.json() == {"detail": "Bad request."}


def test_an_admin_csrf_failure_is_json_and_does_not_echo_the_origin(client):
    response = client.post(
        "/api/admin/login/",
        {"username": "x", "password": "y"},
        headers={"origin": "https://evil.example"},
    )

    assert response.status_code == 403
    assert response.json() == {"detail": "CSRF Failed: Request rejected."}


@pytest.mark.urls("tests.support.error_urls")
def test_an_unhandled_exception_is_a_generic_json_500(client):
    client.raise_request_exception = False

    response = client.get("/api/boom/")

    assert response.status_code == 500
    assert response.json() == {"detail": "A server error occurred."}


def test_a_browser_gets_json_not_the_browsable_api(client):
    response = client.get("/api/frames/", HTTP_ACCEPT="text/html")

    assert response["Content-Type"] == "application/json"
    assert "Django REST framework" not in response.content.decode()


def test_the_api_root_does_not_list_endpoints(client):
    response = client.get("/api/", HTTP_ACCEPT="text/html")

    assert response.status_code == 404
    assert response.json() == {"detail": "Not found."}
