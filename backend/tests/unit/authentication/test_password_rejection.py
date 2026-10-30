import pytest
from django.core.exceptions import ValidationError

from authentication.views import LOGGED_REJECTIONS, _failed_rules, _logged_reason


@pytest.mark.parametrize("code", LOGGED_REJECTIONS)
def test_a_known_reason_is_logged_as_is(code):
    assert _logged_reason(code) == code


def test_an_unknown_reason_is_logged_as_other():
    assert _logged_reason("free text from somewhere") == "other"


def test_only_known_rules_are_reported(monkeypatch):
    def reject(candidate, user):
        raise ValidationError(
            [
                ValidationError("short", code="password_too_short"),
                ValidationError("custom", code=candidate),
            ]
        )

    monkeypatch.setattr("authentication.views.validate_password", reject)

    assert _failed_rules("secret-input-1", None) == ["password_too_short"]
