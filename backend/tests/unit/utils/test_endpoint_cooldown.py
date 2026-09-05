from django.core.cache import cache
from freezegun import freeze_time

from utils.endpoint_request_cooldown import (
    check_endpoint_request_cooldown,
    set_endpoint_request_cooldown,
)

KEY = "cooldown-test-key"


def test_a_fresh_key_is_allowed():
    allowed, remaining = check_endpoint_request_cooldown(KEY)

    assert allowed and remaining == 0


def test_a_set_key_blocks():
    set_endpoint_request_cooldown(KEY, 30)

    allowed, remaining = check_endpoint_request_cooldown(KEY, 30)

    assert not allowed
    assert 0 < remaining <= 30


def test_the_remaining_time_counts_down():
    with freeze_time("2026-01-01 12:00:00"):
        set_endpoint_request_cooldown(KEY, 30)

    with freeze_time("2026-01-01 12:00:20"):
        _, remaining = check_endpoint_request_cooldown(KEY, 30)

    assert remaining == 10


def test_the_cooldown_lapses():
    with freeze_time("2026-01-01 12:00:00"):
        set_endpoint_request_cooldown(KEY, 30)

    with freeze_time("2026-01-01 12:00:31"):
        allowed, remaining = check_endpoint_request_cooldown(KEY, 30)

    assert allowed and remaining == 0


def test_keys_are_independent():
    set_endpoint_request_cooldown(KEY, 30)

    allowed, _ = check_endpoint_request_cooldown("another-key", 30)

    assert allowed


def test_the_entry_expires_from_the_cache():
    set_endpoint_request_cooldown(KEY, 30)
    cache.delete(KEY)

    allowed, _ = check_endpoint_request_cooldown(KEY, 30)

    assert allowed
