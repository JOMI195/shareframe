import logging
from collections import defaultdict

from asgiref.sync import async_to_sync
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from frames.consumers import FrameWebSocketConsumer
from frames.models import FrameWebsocketConnection
from friendships.models import Friendship
from user_stats.counters import record_send

from .models import SentImage, SentImageStatus

logger = logging.getLogger(__name__)


def _are_friends(sender, reciever) -> bool:
    if sender == reciever:
        return True
    return Friendship.objects.filter(
        (Q(sender=sender) & Q(reciever=reciever))
        | (Q(sender=reciever) & Q(reciever=sender)),
        status="accepted",
    ).exists()


def deliver_scheduled_sent_image(
    sent_image_id: int, *, early: bool
) -> SentImage | None:
    with transaction.atomic():
        sent_image = (
            SentImage.objects.scheduled()
            .select_for_update(skip_locked=True, of=("self",))
            .select_related("sender", "reciever", "image")
            .filter(id=sent_image_id)
            .first()
        )
        if sent_image is None:
            return None

        if not _are_friends(sent_image.sender, sent_image.reciever):
            logger.info(
                f"Dropping scheduled SentImage {sent_image.id}, friendship no longer exists"
            )
            sent_image.delete()
            return None

        now = timezone.now()
        if early and sent_image.expires_at and sent_image.scheduled_for:
            sent_image.expires_at = now + (
                sent_image.expires_at - sent_image.scheduled_for
            )
        sent_image.status = SentImageStatus.SENT
        sent_image.sent_at = now
        sent_image.save(update_fields=["status", "sent_at", "expires_at"])
        record_send(sent_image.sender, sent_image.reciever)

        transaction.on_commit(lambda: _push(sent_image))

    logger.info(f"Delivered scheduled SentImage {sent_image.id}")
    return sent_image


def _push(sent_image: SentImage):
    expires_at = sent_image.expires_at
    async_to_sync(FrameWebSocketConsumer.send_picture_to_user_frames)(
        sender=sent_image.sender,
        reciever=sent_image.reciever,
        image=sent_image.image,
        expiry_unix_timestamp=int(expires_at.timestamp()) if expires_at else None,
        expiry_datetime=expires_at,
        sent_image_id=sent_image.id,
    )


def clear_from_frames(sent_images):
    """After commit, tell the receivers' frames to drop these sent images."""
    ids_by_channel = defaultdict(list)
    connections = FrameWebsocketConnection.objects.filter(
        frame__is_active=True, frame__user__image_reciever__in=sent_images
    ).values_list("channel_name", "frame__user__image_reciever")
    for channel_name, sent_image_id in connections:
        ids_by_channel[channel_name].append(sent_image_id)

    def push():
        for channel_name, sent_image_ids in ids_by_channel.items():
            async_to_sync(
                FrameWebSocketConsumer.send_clear_specific_images_to_channels
            )([channel_name], sent_image_ids)

    transaction.on_commit(push)
