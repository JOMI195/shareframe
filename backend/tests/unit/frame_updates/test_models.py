import pytest
from django.core.exceptions import ValidationError

from frame_updates.models import Release


@pytest.mark.parametrize("version", ["1.0.0", "0.0.1", "10.20.30"])
def test_accepts_a_semantic_version(version):
    Release(version=version, checksum="x").clean()


@pytest.mark.parametrize("version", ["1.0", "1", "not-a-version", ""])
def test_rejects_anything_that_is_not_three_parts(version):
    with pytest.raises(ValidationError) as error:
        Release(version=version, checksum="x").clean()

    assert "version" in error.value.message_dict
