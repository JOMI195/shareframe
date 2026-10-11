from django.contrib import admin, messages
from inline_actions.admin import InlineActionsModelAdminMixin

from utils.admin import RowAction, confirm_page

from .delivery import deliver_scheduled_sent_image
from .models import SentImage, SentImageStatus


def _scheduled_or_warn(modeladmin, request, queryset):
    scheduled = queryset.scheduled()
    if not scheduled.exists():
        modeladmin.message_user(
            request, "None of the selected images is scheduled.", messages.WARNING
        )
    return scheduled


@admin.action(description="Send scheduled images now")
def send_scheduled_now(modeladmin, request, queryset):
    scheduled = _scheduled_or_warn(modeladmin, request, queryset)
    if not scheduled.exists():
        return None
    if "apply" not in request.POST:
        return confirm_page(
            modeladmin,
            request,
            scheduled,
            "send_scheduled_now",
            "Send scheduled images now",
            "These scheduled images are sent to the receivers' frames right away. "
            "Their display duration is kept.",
        )

    sent = sum(
        deliver_scheduled_sent_image(pk, early=True) is not None
        for pk in scheduled.values_list("pk", flat=True)
    )
    modeladmin.message_user(request, f"Sent {sent} scheduled images.")
    return None


@admin.action(description="Cancel scheduled images")
def cancel_scheduled(modeladmin, request, queryset):
    scheduled = _scheduled_or_warn(modeladmin, request, queryset)
    if not scheduled.exists():
        return None
    if "apply" not in request.POST:
        return confirm_page(
            modeladmin,
            request,
            scheduled,
            "cancel_scheduled",
            "Cancel scheduled images",
            "These scheduled images are deleted and never sent.",
        )

    cancelled, _ = scheduled.delete()
    modeladmin.message_user(request, f"Cancelled {cancelled} scheduled images.")
    return None


@admin.register(SentImage)
class SentImageAdmin(InlineActionsModelAdminMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "sender",
        "reciever",
        "status",
        "scheduled_for",
        "sent_at",
        "expires_at",
    )
    list_filter = ("status", "sent_at", "scheduled_for")
    search_fields = ("sender__username", "reciever__username")
    ordering = ("-sent_at",)
    actions = [send_scheduled_now, cancel_scheduled]
    send_now = RowAction(send_scheduled_now, "Send now")
    cancel = RowAction(cancel_scheduled, "Cancel")
    inline_actions = ["send_now", "cancel"]
    readonly_fields = (
        "sender",
        "reciever",
        "image",
        "status",
        "scheduled_for",
        "sent_at",
        "expires_at",
    )

    fieldsets = (
        (
            None,
            {
                "fields": ("sender", "reciever", "image", "status"),
            },
        ),
        (
            "Timestamps",
            {
                "fields": ("scheduled_for", "sent_at", "expires_at"),
            },
        ),
    )

    def get_inline_actions(self, request, obj=None):
        if obj is None or obj.status != SentImageStatus.SCHEDULED:
            return []
        return super().get_inline_actions(request, obj)
