"""The board matches on these numbers, so they are part of the wire contract."""

from frames.close_codes import WS_CLOSE_AUTH_REJECTED, WS_CLOSE_TOKEN_REVOKED


def test_the_codes_are_in_the_private_range():
    for code in (WS_CLOSE_AUTH_REJECTED, WS_CLOSE_TOKEN_REVOKED):
        assert 4000 <= code <= 4999


def test_the_two_reasons_are_distinguishable():
    assert WS_CLOSE_AUTH_REJECTED != WS_CLOSE_TOKEN_REVOKED
