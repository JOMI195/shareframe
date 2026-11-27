import pytest

from frames.validators import is_valid_local_ip, is_valid_version


@pytest.mark.parametrize("value", ["192.168.1.20", "10.0.0.5", "fe80::1"])
def test_ip_addresses_pass(value):
    assert is_valid_local_ip(value)


@pytest.mark.parametrize(
    "value", ["not-an-ip", "evil.example", "", 42, None, ["1.2.3.4"]]
)
def test_anything_but_an_ip_is_refused(value):
    assert not is_valid_local_ip(value)


def test_a_version_up_to_the_column_width_passes():
    assert is_valid_version("x" * 100)


@pytest.mark.parametrize("value", ["x" * 101, "", 5, None, {"v": 1}])
def test_a_version_that_does_not_fit_is_refused(value):
    assert not is_valid_version(value)
