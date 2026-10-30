import logging

from django.conf import settings
from djoser.email import (
    ActivationEmail,
    BaseDjoserEmail,
    ConfirmationEmail,
    PasswordChangedConfirmationEmail,
    PasswordResetEmail,
)

from .tasks import send_account_mail

logger = logging.getLogger(__name__)


def _task_context(context):
    task_context = {
        k: v
        for k, v in context.items()
        if isinstance(v, (str, int, float, bool, type(None)))
    }
    if "user" in context:
        task_context["user"] = {"username": context["user"].username}
    return task_context


class _LogoMail:
    mail_subject = ""

    def get_context_data(self):
        context = super().get_context_data()
        context["subject"] = self.mail_subject
        return context

    def send(self, to, *args, **kwargs):
        send_account_mail.apply_async(
            kwargs={
                "template_name": self.template_name,
                "context": _task_context(self.get_context_data()),
                "from_email": settings.DEFAULT_FROM_EMAIL,
                "to_emails": list(to),
            },
            kwargsrepr=repr({"template_name": self.template_name}),
        )


class _NoticeMail(_LogoMail):
    """Sent after the action is saved, so a failed delivery must not fail the request."""

    def send(self, to, *args, **kwargs):
        try:
            super().send(to)
        except Exception:
            logger.exception("Notice mail %s failed", self.template_name)


class DjoserActivationEmail(_LogoMail, ActivationEmail):
    template_name = "djoser/activation.html"
    mail_subject = "ShareFrame - Konto aktivieren"


class DjoserConfirmationEmail(_NoticeMail, ConfirmationEmail):
    template_name = "djoser/confirmation.html"
    mail_subject = "ShareFrame - Konto aktiviert"


class DjoserPasswordResetEmail(_LogoMail, PasswordResetEmail):
    template_name = "djoser/password_reset.html"
    mail_subject = "ShareFrame - Passwort zurücksetzen"


class DjoserPasswordChangedConfirmationEmail(
    _NoticeMail, PasswordChangedConfirmationEmail
):
    template_name = "djoser/password_changed_confirmation.html"
    mail_subject = "ShareFrame - Passwort geändert"


class DjoserUserDeletedEmail(_NoticeMail, BaseDjoserEmail):
    template_name = "djoser/user_deleted.html"
    mail_subject = "ShareFrame - Konto gelöscht"


class DjoserEmailChangeConfirmEmail(_LogoMail, BaseDjoserEmail):
    template_name = "djoser/email_change_confirm.html"
    mail_subject = "ShareFrame - Neue E-Mail-Adresse bestätigen"

    def get_context_data(self):
        context = super().get_context_data()
        context["url"] = settings.FRONTEND_EMAIL_CHANGE_CONFIRM_URL.format(
            token=context["token"]
        )
        return context


# The user already carries the new address; `to` is the old one.
class DjoserEmailChangedEmail(_NoticeMail, BaseDjoserEmail):
    template_name = "djoser/email_changed.html"
    mail_subject = "ShareFrame - E-Mail-Adresse geändert"
