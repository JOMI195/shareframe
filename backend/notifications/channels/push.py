import json
import logging

from django.conf import settings
from pywebpush import WebPushException, webpush

from ..models import PushSubscription
from .base import Channel

logger = logging.getLogger(__name__)

GONE_STATUSES = {404, 410}
TTL_SECONDS = 24 * 60 * 60


class PushChannel(Channel):
    def is_available(self, account):
        return bool(settings.VAPID_PRIVATE_KEY) and account.push_subscriptions.exists()

    def send(self, account, kind, message, *, preview=False):
        payload = json.dumps(
            {
                "title": message.title,
                "body": message.body,
                "url": "/" + message.url,
                "tag": message.tag or kind,
            }
        )
        delivered = False
        for subscription in account.push_subscriptions.all():
            delivered |= self._send_one(subscription, payload)
        return delivered

    def _send_one(self, subscription: PushSubscription, payload: str) -> bool:
        try:
            webpush(
                subscription_info={
                    "endpoint": subscription.endpoint,
                    "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth},
                },
                data=payload,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": settings.VAPID_SUBJECT},
                ttl=TTL_SECONDS,
            )
            return True
        except WebPushException as exc:
            status = getattr(exc.response, "status_code", None)
            if status in GONE_STATUSES:
                subscription.delete()
            else:
                logger.warning(
                    "Push to subscription %s failed: %s", subscription.pk, exc
                )
            return False
