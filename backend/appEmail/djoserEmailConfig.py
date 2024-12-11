from django.conf import settings
from .tasks import send_django_mail_with_logo
from djoser.email import (
    ActivationEmail,
    ConfirmationEmail,
    PasswordResetEmail,
    PasswordChangedConfirmationEmail,
    BaseDjoserEmail,
)


class DjoserActivationEmail(ActivationEmail):
    template_name = "djoser/activation.html"

    def get_context_data(self):
        context = super().get_context_data()
        context["subject"] = (
            "Willkommen bei ShareFrame.de! Wir freuen uns, dich an Bord zu haben."
        )
        return context

    def send(self, *args, **kwargs):
        context = self.get_context_data()
        send_django_mail_with_logo(
            template_name=self.template_name,
            context=context,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to_emails=[context["user"].email],
        )


class DjoserConfirmationEmail(ConfirmationEmail):
    template_name = "djoser/confirmation.html"

    def get_context_data(self):
        context = super().get_context_data()
        context["subject"] = (
            "Dein Konto ist jetzt aktiv. Viel Spaß beim Teilen deiner schönsten Momente!"
        )
        return context

    def send(self, *args, **kwargs):
        context = self.get_context_data()
        send_django_mail_with_logo(
            template_name=self.template_name,
            context=context,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to_emails=[context["user"].email],
        )


class DjoserPasswordResetEmail(PasswordResetEmail):
    template_name = "djoser/password_reset.html"

    def get_context_data(self):
        context = super().get_context_data()
        context["subject"] = (
            "Keine Sorge, wir sind für dich da. Setze dein Passwort zurück, um wieder Zugriff zu erhalten."
        )
        return context

    def send(self, *args, **kwargs):
        context = self.get_context_data()
        send_django_mail_with_logo(
            template_name=self.template_name,
            context=context,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to_emails=[context["user"].email],
        )


class DjoserPasswordChangedConfirmationEmail(PasswordChangedConfirmationEmail):
    template_name = "djoser/password_changed_confirmation.html"

    def get_context_data(self):
        context = super().get_context_data()
        context["subject"] = (
            "Dein Passwort wurde erfolgreich aktualisiert. Dein Konto ist jetzt sicherer!"
        )
        return context

    def send(self, *args, **kwargs):
        context = self.get_context_data()
        send_django_mail_with_logo(
            template_name=self.template_name,
            context=context,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to_emails=[context["user"].email],
        )


class DjoserUserDeletedEmail(BaseDjoserEmail):
    template_name = "djoser/user_deleted.html"

    def get_context_data(self):
        context = super().get_context_data()
        context["subject"] = "Dein Konto wurde gelöscht – Alles Gute und bis bald! 👋"
        return context

    def send(self, *args, **kwargs):
        context = self.get_context_data()
        send_django_mail_with_logo(
            template_name=self.template_name,
            context=context,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to_emails=[context["user"].email],
        )
