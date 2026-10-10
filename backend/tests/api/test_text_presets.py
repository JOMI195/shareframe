import pytest

from images.models import TextPreset
from images.serializers import MAX_TEXT_PRESETS
from tests.support import seed
from tests.support.factories import TextPresetFactory
from user_core.models import User

pytestmark = pytest.mark.django_db

URL = "/api/text-presets/"

PAYLOAD = {
    "text": "Beispieltext",
    "x": 0.25,
    "y": 0.75,
    "rotation": -15,
    "font_size": 0.1,
    "color": "white",
    "background": True,
    "font": "serif",
    "bold": True,
}


def owner(username):
    return User.objects.get(username=username)


def test_requires_authentication(client):
    assert client.get(URL).status_code == 401


class TestList:
    def test_lists_only_the_users_own_presets_oldest_first(self, alice):
        first = TextPresetFactory(user=owner(seed.ALICE))
        second = TextPresetFactory(user=owner(seed.ALICE))
        TextPresetFactory(user=owner(seed.BOB))

        response = alice.get(URL)

        assert response.status_code == 200
        assert [preset["id"] for preset in response.data] == [first.id, second.id]


class TestCreate:
    def test_saves_the_preset_for_the_caller(self, alice):
        response = alice.post(URL, PAYLOAD, format="json")

        assert response.status_code == 201
        assert {key: response.data[key] for key in PAYLOAD} == PAYLOAD
        assert TextPreset.objects.get(pk=response.data["id"]).user == owner(seed.ALICE)

    @pytest.mark.parametrize(
        "field, value",
        [
            ("x", 1.5),
            ("y", -0.1),
            ("font_size", 0),
            ("font_size", 2),
            ("rotation", 400),
            ("text", "  "),
            ("color", "red"),
            ("font", "comic"),
        ],
    )
    def test_rejects_invalid_values(self, alice, field, value):
        response = alice.post(URL, {**PAYLOAD, field: value}, format="json")

        assert response.status_code == 400
        assert field in response.data

    def test_rejects_more_than_the_cap(self, alice):
        TextPresetFactory.create_batch(MAX_TEXT_PRESETS, user=owner(seed.ALICE))

        response = alice.post(URL, PAYLOAD, format="json")

        assert response.status_code == 400

    def test_requires_the_csrf_token(self, alice):
        alice.cookies.pop("csrftoken")

        assert alice.post(URL, PAYLOAD, format="json").status_code == 403


class TestDestroy:
    def test_deletes_an_own_preset(self, alice):
        preset = TextPresetFactory(user=owner(seed.ALICE))

        response = alice.delete(f"{URL}{preset.id}/")

        assert response.status_code == 204
        assert not TextPreset.objects.filter(pk=preset.id).exists()

    def test_another_users_preset_is_not_found(self, alice):
        preset = TextPresetFactory(user=owner(seed.BOB))

        assert alice.delete(f"{URL}{preset.id}/").status_code == 404
        assert TextPreset.objects.filter(pk=preset.id).exists()
