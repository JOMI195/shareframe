def html_of(message):
    """The HTML part; `body` holds the plain-text version."""
    content, mimetype = message.alternatives[0]
    assert mimetype == "text/html"
    return content


def break_delivery(monkeypatch):
    """Every send raises, like an unreachable SMTP server."""
    from smtplib import SMTPServerDisconnected

    from django.core.mail.message import EmailMessage

    def fail(self, fail_silently=False):
        raise SMTPServerDisconnected("Connection unexpectedly closed")

    monkeypatch.setattr(EmailMessage, "send", fail)
