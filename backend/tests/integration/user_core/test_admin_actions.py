import os

import pytest
from django.contrib import admin
from django.contrib.messages.storage.fallback import FallbackStorage
from django.test import RequestFactory

from tests.support.factories import ImageFactory, UserFactory
from user_core.models import User

pytestmark = pytest.mark.django_db


@pytest.fixture
def model_admin():
    return admin.site._registry[User]


@pytest.fixture
def staff():
    return UserFactory(is_active=True, is_staff=True, is_admin=True)


def admin_request(user, data=None):
    request = RequestFactory().post("/api/admin/user_core/user/", data or {})
    request.user = user
    request.session = {}
    request._messages = FallbackStorage(request)
    return request


def test_bulk_delete_removes_the_users(model_admin, staff):
    pks = [UserFactory(is_active=True).pk for _ in range(2)]

    model_admin.delete_queryset(admin_request(staff), User.objects.filter(pk__in=pks))

    assert not User.objects.filter(pk__in=pks).exists()


def test_bulk_delete_removes_the_image_files(model_admin, staff):
    image = ImageFactory()
    path = image.image.path

    model_admin.delete_queryset(
        admin_request(staff), User.objects.filter(pk=image.user_id)
    )

    assert not os.path.exists(path)


def test_staff_without_superuser_get_no_bulk_delete(model_admin, staff):
    assert "delete_selected" not in model_admin.get_actions(admin_request(staff))
