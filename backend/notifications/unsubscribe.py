from django.core import signing

SALT = "notifications.unsubscribe"


def make_token(account, kind, channel):
    return signing.dumps([account.pk, kind, channel], salt=SALT)


def read_token(token):
    """Return (account_id, kind, channel), raise signing.BadSignature when tampered."""
    account_id, kind, channel = signing.loads(token, salt=SALT)
    return account_id, kind, channel
