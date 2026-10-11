import pytest
from django.test import Client

from tests.support import seed
from tests.support.factories import UserFactory
from user_stats.counters import bump

pytestmark = pytest.mark.django_db

URL = "/api/admin/user_stats/userstats/"


@pytest.fixture
def admin_client():
    client = Client()
    client.force_login(UserFactory(is_active=True, is_staff=True, is_admin=True))
    return client


def test_lists_the_counters_with_totals(admin_client):
    response = admin_client.get(URL)

    assert response.status_code == 200
    totals = dict(response.context["totals"])
    assert totals["images sent"] == sum(
        spec["images_sent"] for spec in seed.user_stats().values()
    )
    assert seed.ALICE in response.content.decode()


def test_totals_follow_the_search(admin_client):
    first, second = UserFactory(), UserFactory()
    bump(first, "images_sent", by=2)
    bump(second, "images_sent", by=3)

    response = admin_client.get(URL, {"q": first.username})

    assert dict(response.context["totals"])["images sent"] == 2


def test_rows_cannot_be_edited(admin_client):
    bump(UserFactory(), "images_sent")

    assert admin_client.get(f"{URL}add/").status_code == 403
