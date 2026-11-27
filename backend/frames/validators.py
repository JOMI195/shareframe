from django.core.exceptions import ValidationError
from django.core.validators import validate_ipv46_address

from .models import Frame


def is_valid_local_ip(value):
    if not isinstance(value, str):
        return False
    try:
        validate_ipv46_address(value)
    except ValidationError:
        return False
    return True


def is_valid_version(value):
    max_length = Frame._meta.get_field("version").max_length
    return isinstance(value, str) and 0 < len(value) <= max_length
