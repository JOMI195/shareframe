import logging

from config.celery import celery

from .models import Image

logger = logging.getLogger("celery.images")


@celery.task
def delete_marked_as_deleted_images_without_sent_images():
    """Delete images which are marked as deleted and dont have corresponding sentImages"""
    logger.info("Starting cleanup of deleted images")

    unsent_images = Image.objects.filter(markedAsDeleted=True, sent_image__isnull=True)

    deleteCount = 0
    for image in unsent_images:
        logger.info(
            f"Permanently deleting image ID {image.id} - no associated SentImages"
        )
        image.delete()
        deleteCount += 1

    logger.info(f"Cleanup completed: {deleteCount} images permanently deleted")
    return f"Deleted {deleteCount} images which are marked as deleted and dont have corresponding sentImages."


@celery.task
def mark_expired_images_to_be_deleted():
    """Mark images for deletion if they have auto_delete_after_period=True and have expired"""
    logger.info("Starting check for expired images which can be marked as deleted")

    cutoff = Image.auto_delete_cutoff()
    marked_count = 0
    if cutoff is not None:
        marked_count = Image.objects.filter(
            auto_delete_after_period=True,
            markedAsDeleted=False,
            created_at__lte=cutoff,
        ).update(markedAsDeleted=True)

    logger.info(
        f"Auto-deletion check completed: {marked_count} images marked for deletion"
    )
    return f"Auto-marked {marked_count} images for deletion based on expiry settings."
