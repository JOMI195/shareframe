"""Settings for the pytest run. Everything not listed here comes from config.settings."""

import os

from .settings import *  # noqa: F401,F403
from .settings import BASE_DIR, DATABASES, MIDDLEWARE, REST_FRAMEWORK

# The suite runs on the host; the shared test stack publishes backend_db on 5433.
DATABASES["default"]["HOST"] = os.environ["TEST_DB_HOST"]
DATABASES["default"]["PORT"] = os.environ["TEST_DB_PORT"]

# Mounts MediaAccessView & friends, which carry the X-Accel-Redirect authorisation.
DEBUG = False

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "shareframe-tests",
    }
}

CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# It reads and logs request.body on every request, multipart uploads included.
MIDDLEWARE = [m for m in MIDDLEWARE if "request_logging" not in m]

# The stock config attaches seven RotatingFileHandlers and creates backend/logs/.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"null": {"class": "logging.NullHandler"}},
    "root": {"handlers": ["null"], "level": "CRITICAL"},
}

# Seeding writes real files and generates variants; keep them out of mediafiles/.
MEDIA_ROOT = BASE_DIR / os.environ["TEST_MEDIA_ROOT"]

# Views pin their own throttle_classes, so the rates are the only lever that
# disables them everywhere. A rate of None makes SimpleRateThrottle wave the
# request through. The `throttled` fixture puts the real rates back.
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_THROTTLE_RATES": dict.fromkeys(REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]),
}
