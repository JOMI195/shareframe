"""Root fixtures. Scaffolding lives in tests/support/."""

import shutil

import pytest
from django.conf import settings as django_settings
from django.core.management import call_command
from django.core.cache import cache

from tests.support import seed
from tests.support.helpers.auth import CookieClient, sign_in, sign_in_with
from tests.support.helpers.images import image_bytes


def _ensure_brand_logo():
    """mediafiles/ is gitignored, so a fresh checkout has none and every login 500s."""
    logo = (
        django_settings.BASE_DIR
        / "mediafiles"
        / "brand"
        / "logo-email-light-full-shareframe.png"
    )
    if logo.exists():
        return
    logo.parent.mkdir(parents=True, exist_ok=True)
    logo.write_bytes(image_bytes(size=(4, 4)))


def _corpus_is_present():
    from user_core.models import User

    return User.objects.filter(username=seed.ALICE).exists()


def seed_corpus():
    call_command("create_image_sizes", verbosity=0)
    call_command("seed_dev_data", verbosity=0)
    call_command("seed_changelogs", verbosity=0)


def pytest_collection_modifyitems(items):
    """Enforce the tier split, then order the run."""
    misfiled = [
        item.nodeid
        for item in items
        if "/unit/" in item.nodeid and item.get_closest_marker("django_db")
    ]
    if misfiled:
        raise pytest.UsageError(
            "unit tests must not use the database:\n  " + "\n  ".join(misfiled)
        )

    # They flush the database, so run them last. The sort is stable.
    def is_transactional(item):
        marker = item.get_closest_marker("django_db")
        return bool(marker and marker.kwargs.get("transaction"))

    items.sort(key=is_transactional)


@pytest.fixture(scope="session")
def django_db_setup(django_db_setup, django_db_blocker):
    """Seed once per session; every django_db test rolls back onto it."""
    media_root = django_settings.MEDIA_ROOT
    with django_db_blocker.unblock():
        _ensure_brand_logo()
        if _corpus_is_present():
            # --reuse-db: the corpus and its image files are already there.
            return

        shutil.rmtree(media_root, ignore_errors=True)
        media_root.mkdir(parents=True, exist_ok=True)
        seed_corpus()


@pytest.fixture
def _django_db_helper(request, _django_db_helper):
    """Put the corpus back after a transactional test flushed it.

    Transactional tests are skipped: they run last and build their own data.
    """
    marker = request.node.get_closest_marker("django_db")
    if marker and marker.kwargs.get("transaction"):
        yield
        return

    if not _corpus_is_present():
        seed_corpus()
    yield


@pytest.fixture(scope="session", autouse=True)
def _eager_celery():
    """The app is configured from config.celeryconfig, not from Django settings."""
    from config.celery import celery

    celery.conf.task_always_eager = True
    celery.conf.task_eager_propagates = True


@pytest.fixture(autouse=True)
def _clear_cache():
    """locmem is process-wide; throttle history and cooldowns must not leak."""
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def throttled(monkeypatch):
    """Restore the real throttle rates.

    THROTTLE_RATES is bound to the class at import, so the setting alone is not enough.
    """
    from rest_framework.throttling import SimpleRateThrottle

    from config.settings import REST_FRAMEWORK as PRODUCTION_REST_FRAMEWORK

    monkeypatch.setattr(
        SimpleRateThrottle,
        "THROTTLE_RATES",
        PRODUCTION_REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"],
    )


@pytest.fixture
def client():
    return CookieClient()


@pytest.fixture
def client_for():
    """Sign in as any seeded account: `client_for(seed.BOB)`."""

    def _client_for(username=seed.ALICE):
        # A preceding transactional test may have flushed the corpus away.
        if not _corpus_is_present():
            seed_corpus()
        return sign_in(CookieClient(), username)

    return _client_for


@pytest.fixture
def client_as():
    """Sign in as a factory-built user."""

    def _client_as(user, password="factory-pass1"):
        return sign_in_with(CookieClient(), user.email, password)

    return _client_as


@pytest.fixture
def alice(client_for):
    return client_for(seed.ALICE)


@pytest.fixture
def bob(client_for):
    return client_for(seed.BOB)


@pytest.fixture
def carol(client_for):
    return client_for(seed.CAROL)
