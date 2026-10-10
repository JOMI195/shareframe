import pytest
from django.contrib import admin
from django.contrib.messages.storage.fallback import FallbackStorage
from django.test import RequestFactory

from tests.support.factories import UserFactory
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


@pytest.mark.parametrize("action", ["soft_delete", "soft_delete_keep_name"])
def test_soft_delete_asks_for_confirmation_first(model_admin, staff, action):
    user = UserFactory(is_active=True)

    response = getattr(model_admin, action)(admin_request(staff), user)

    assert response.template_name == "admin/confirm_action.html"
    assert list(response.context_data["objects"]) == [user]
    user.refresh_from_db()
    assert not user.is_deleted


def test_confirming_soft_deletes_and_anonymizes(model_admin, staff):
    user = UserFactory(is_active=True)

    model_admin.soft_delete(admin_request(staff, {"apply": "yes"}), user)

    user_after = User.objects.get(pk=user.pk)
    assert user_after.is_deleted
    assert not user_after.is_active
    assert user_after.email != user.email
    assert user_after.username != user.username


def test_confirming_without_anonymizing_keeps_the_name(model_admin, staff):
    user = UserFactory(is_active=True)

    model_admin.soft_delete_keep_name(admin_request(staff, {"apply": "yes"}), user)

    user_after = User.objects.get(pk=user.pk)
    assert user_after.is_deleted
    assert user_after.username == user.username


def test_rows_offer_soft_delete_to_admins(model_admin, staff):
    user = UserFactory(is_active=True)

    assert model_admin.get_inline_actions(admin_request(staff), user) == [
        "soft_delete",
        "soft_delete_keep_name",
    ]


def test_deleted_users_have_no_row_actions(model_admin, staff):
    user = UserFactory(is_active=True, is_deleted=True)

    assert model_admin.get_inline_actions(admin_request(staff), user) == []


def test_staff_without_change_permission_get_no_row_actions(model_admin):
    viewer = UserFactory(is_active=True, is_staff=True, is_admin=False)
    user = UserFactory(is_active=True)

    assert model_admin.get_inline_actions(admin_request(viewer), user) == []
