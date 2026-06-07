import logging
from datetime import datetime

from django.conf import settings
from django.contrib.admin.models import LogEntry, ADDITION, CHANGE, DELETION
from django.contrib.auth import get_user_model
from django.contrib.auth.signals import user_logged_in, user_login_failed
from django.db.models.signals import post_save
from django.dispatch import receiver

from appEmail.tasks import send_django_mail_with_logo

logger = logging.getLogger("admin.audit")

User = get_user_model()

ACTION_MAP = {ADDITION: "CREATE", CHANGE: "UPDATE", DELETION: "DELETE"}


def _get_client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


def _is_admin_request(request):
    return request and request.path.startswith("/api/admin/")


@receiver(user_logged_in)
def on_user_logged_in(sender, request, user, **kwargs):
    ip = _get_client_ip(request)
    timestamp = datetime.now().strftime("%d.%m.%Y %H:%M:%S")

    logger.info("Login: %s from %s", user.email, ip)

    subject = "ShareFrame Admin Login" if _is_admin_request(request) else "ShareFrame Login"
    send_django_mail_with_logo.delay(
        template_name="authentication/login.html",
        context={
            "subject": subject,
            "user_email": user.email,
            "ip_address": ip,
            "timestamp": timestamp,
        },
        from_email=settings.DEFAULT_FROM_EMAIL,
        to_emails=[user.email],
    )


@receiver(user_login_failed)
def on_user_login_failed(sender, credentials, request, **kwargs):
    ip = _get_client_ip(request)
    attempted = credentials.get("username", credentials.get("email", "unknown"))
    timestamp = datetime.now().strftime("%d.%m.%Y %H:%M:%S")

    logger.warning("Failed login attempt for '%s' from %s", attempted, ip)

    if _is_admin_request(request):
        send_django_mail_with_logo.delay(
            template_name="authentication/failed_login.html",
            context={
                "subject": "ShareFrame - Fehlgeschlagener Admin Login-Versuch",
                "attempted_credential": attempted,
                "ip_address": ip,
                "timestamp": timestamp,
            },
            from_email=settings.DEFAULT_FROM_EMAIL,
            to_emails=[settings.DEFAULT_FROM_EMAIL],
        )
        return

    # normal user: notify the owner only if the attempted email is a real account
    user = User.objects.filter(email=attempted, is_deleted=False).first()
    if not user:
        return

    send_django_mail_with_logo.delay(
        template_name="authentication/failed_login.html",
        context={
            "subject": "ShareFrame - Fehlgeschlagener Login-Versuch",
            "attempted_credential": attempted,
            "ip_address": ip,
            "timestamp": timestamp,
        },
        from_email=settings.DEFAULT_FROM_EMAIL,
        to_emails=[user.email],
    )


@receiver(post_save, sender=LogEntry)
def on_admin_action(sender, instance, created, **kwargs):
    if not created:
        return

    action = ACTION_MAP.get(instance.action_flag, "UNKNOWN")
    logger.info(
        "Admin %s by %s on %s (id=%s): %s",
        action,
        instance.user,
        instance.content_type,
        instance.object_id,
        instance.object_repr,
    )
