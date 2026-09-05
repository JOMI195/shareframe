from types import SimpleNamespace

from images.permissions import CurrentUserOrAdmin


def check(user, obj):
    return CurrentUserOrAdmin().has_object_permission(
        SimpleNamespace(user=user), None, obj
    )


def test_a_user_may_reach_their_own_object():
    user = SimpleNamespace(pk=7, is_staff=False)

    assert check(user, SimpleNamespace(pk=7))


def test_a_user_may_not_reach_someone_elses():
    user = SimpleNamespace(pk=7, is_staff=False)

    assert not check(user, SimpleNamespace(pk=8))


def test_staff_may_reach_anything():
    staff = SimpleNamespace(pk=7, is_staff=True)

    assert check(staff, SimpleNamespace(pk=8))
