import pytest
from django.conf import settings
from django.test import Client

from images.models import Image
from tests.support import seed
from tests.support.factories import UserFactory

pytestmark = pytest.mark.django_db

URL = "/api/admin/images/image/"


@pytest.fixture
def admin_client():
    client = Client()
    client.force_login(UserFactory(is_active=True, is_staff=True, is_admin=True))
    return client


def test_the_change_page_shows_file_names_without_links(admin_client):
    image = Image.objects.filter(user__username=seed.BOB).first()

    html = admin_client.get(f"{URL}{image.pk}/change/").content.decode()

    assert settings.MEDIA_URL + "private/" not in html
    assert image.image.name in html
    for variant in image.variants.all():
        assert variant.file.name in html


def test_the_add_page_still_offers_an_upload(admin_client):
    html = admin_client.get(f"{URL}add/").content.decode()

    assert 'type="file"' in html
