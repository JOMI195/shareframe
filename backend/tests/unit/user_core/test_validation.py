from user_core.blacklist import USERNAME_BLACKLIST
from user_core.validation import is_username_allowed

BANNED = USERNAME_BLACKLIST[0]


def test_allows_an_ordinary_username():
    assert is_username_allowed("seed_alice")


def test_rejects_a_blacklisted_term():
    assert not is_username_allowed(BANNED)


def test_is_case_insensitive():
    assert not is_username_allowed(BANNED.upper())


def test_rejects_a_near_miss():
    """One edited character keeps the similarity above the 0.9 default."""
    long_term = max(USERNAME_BLACKLIST, key=len)

    assert not is_username_allowed(long_term + "1")


def test_a_lower_threshold_rejects_more():
    assert is_username_allowed("adminx" * 2)
    assert not is_username_allowed("adminx" * 2, threshold=0.2)


def test_a_threshold_above_one_allows_everything():
    assert is_username_allowed(BANNED, threshold=1.1)
