from django.conf import settings
from django.core import signing
from django.utils.crypto import constant_time_compare, salted_hmac

SALT = "user_core.email_change"


def _fingerprint(email):
    return salted_hmac(SALT, email).hexdigest()[:16]


def make_token(user, new_email):
    return signing.dumps([user.pk, new_email, _fingerprint(user.email)], salt=SALT)


def read_token(token):
    """Return (user_id, new_email, fingerprint), raise signing.BadSignature when tampered or expired."""
    user_id, new_email, fingerprint = signing.loads(
        token, salt=SALT, max_age=settings.EMAIL_CHANGE_TIMEOUT
    )
    return user_id, new_email, fingerprint


def matches(user, fingerprint):
    """The token was issued for the address the user still has."""
    return constant_time_compare(_fingerprint(user.email), fingerprint)
