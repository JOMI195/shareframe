from utils.request_logging.decorators import no_logging
from utils.request_logging.middleware import (
    LOG_BODY_ATTR,
    NO_BODY_LOGGING_MSG_ATTR,
    NO_LOGGING_ATTR,
    NO_LOGGING_MSG,
    NO_LOGGING_MSG_ATTR,
)


def test_suppression_needs_an_explicit_value():
    """Bare @no_logging() writes the default (False) — it does not suppress."""

    @no_logging()
    def bare():
        pass

    @no_logging(value=True)
    def explicit():
        pass

    assert getattr(bare, NO_LOGGING_ATTR) is False
    assert getattr(explicit, NO_LOGGING_ATTR) is True


def test_the_default_message_is_attached():
    @no_logging()
    def view():
        pass

    assert getattr(view, NO_LOGGING_MSG_ATTR) == NO_LOGGING_MSG


def test_a_custom_message_replaces_the_default():
    @no_logging("secrets in here")
    def view():
        pass

    assert getattr(view, NO_LOGGING_MSG_ATTR) == "secrets in here"


def test_silent_drops_the_message():
    @no_logging("ignored", silent=True)
    def view():
        pass

    assert getattr(view, NO_LOGGING_MSG_ATTR) is None


def test_body_logging_can_be_turned_off_on_its_own():
    @no_logging(log_body=False, no_body_logging_msg="body hidden")
    def view():
        pass

    assert getattr(view, LOG_BODY_ATTR) is False
    assert getattr(view, NO_BODY_LOGGING_MSG_ATTR) == "body hidden"


def test_returns_the_same_function():
    def view():
        pass

    assert no_logging()(view) is view
