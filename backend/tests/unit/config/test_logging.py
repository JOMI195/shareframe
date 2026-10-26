from config import celeryconfig
from config.settings import LOGGING

# settings_test swaps LOGGING out, so these read the stock config directly.


def test_module_loggers_reach_the_default_file_and_the_console():
    assert set(LOGGING["root"]["handlers"]) == {"file", "console"}


def test_configured_loggers_do_not_repeat_their_lines_through_root():
    leaking = [
        name
        for name, config in LOGGING["loggers"].items()
        if config.get("handlers") and config.get("propagate", True)
    ]

    assert leaking == []


def test_the_celery_worker_keeps_the_django_root_logger():
    assert celeryconfig.worker_hijack_root_logger is False
