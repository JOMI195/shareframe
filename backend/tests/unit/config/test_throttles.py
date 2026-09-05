from types import SimpleNamespace

from django.test import RequestFactory

from config.throttles import (
    BurstRateThrottle,
    FrameBurstRateThrottle,
    FrameSustainedRateThrottle,
    SustainedRateThrottle,
)


def request_with(auth):
    request = RequestFactory().get("/api/frame-updates/latest/")
    request.auth = auth
    return request


def test_a_frame_throttle_keys_on_the_frame_not_the_owner():
    """request.auth is the Frame; two frames of one user must not share a bucket."""
    key = FrameBurstRateThrottle().get_cache_key(request_with(SimpleNamespace(pk=7)), None)

    assert key.endswith("7")
    assert "frame_burst" in key


def test_two_frames_get_different_keys():
    throttle = FrameBurstRateThrottle()

    first = throttle.get_cache_key(request_with(SimpleNamespace(pk=1)), None)
    second = throttle.get_cache_key(request_with(SimpleNamespace(pk=2)), None)

    assert first != second


def test_without_a_frame_the_request_is_not_throttled():
    assert FrameBurstRateThrottle().get_cache_key(request_with(None), None) is None


def test_the_two_frame_scopes_do_not_collide():
    request = request_with(SimpleNamespace(pk=7))

    burst = FrameBurstRateThrottle().get_cache_key(request, None)
    sustained = FrameSustainedRateThrottle().get_cache_key(request, None)

    assert burst != sustained


def test_the_user_scopes_are_declared():
    assert BurstRateThrottle.scope == "burst"
    assert SustainedRateThrottle.scope == "sustained"
