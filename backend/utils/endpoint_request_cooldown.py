from django.core.cache import cache
from django.utils import timezone


def check_endpoint_request_cooldown(cache_key, cooldown_period=30):
    last_send_time = cache.get(cache_key)

    if last_send_time:
        time_since_last_send = (timezone.now() - last_send_time).total_seconds()
        if time_since_last_send < cooldown_period:
            return False, int(cooldown_period - time_since_last_send)

    return True, 0


def set_endpoint_request_cooldown(cache_key, cooldown_period=30):
    cache.set(cache_key, timezone.now(), cooldown_period)
