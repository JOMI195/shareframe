from user_accounts.models import Account

from ..message import Message


class Channel:
    def is_available(self, account: Account) -> bool:
        raise NotImplementedError

    def send(
        self, account: Account, kind: str, message: Message, *, preview: bool = False
    ) -> bool:
        """Return whether the message reached the account. A preview goes to the admin and skips unsubscribe links."""
        raise NotImplementedError
