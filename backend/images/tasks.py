import logging
from config.celery import celery
from .models import Image
from sent_images.models import SentImage

logger = logging.getLogger("celery.images")


@celery.task
def delete_marked_as_deleted_images_without_sent_images():
    """Delete images which are marked as deleted and dont have corresponding sentImages"""
    logger.info("Starting cleanup of deleted images")

    images_marked_as_deleted = Image.objects.filter(markedAsDeleted=True)
    logger.info(f"Found {images_marked_as_deleted.count()} images marked as deleted")

    deleteCount = 0
    for image in images_marked_as_deleted:
        corresp_sent_images = SentImage.objects.filter(image=image)
        if not corresp_sent_images.exists():
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

    # Get all images that are marked for auto-deletion but not yet deleted
    images_to_check = Image.objects.filter(
        auto_delete_after_period=True, markedAsDeleted=False
    )

    logger.info(f"Found {images_to_check.count()} images to check for auto-deletion")

    marked_count = 0
    for image in images_to_check:
        if image.should_be_auto_deleted():
            logger.info(
                f"Auto-marking image ID {image.id} for deletion - expired after auto-delete period"
            )
            image.markedAsDeleted = True
            image.save(update_fields=["markedAsDeleted"])
            marked_count += 1

    logger.info(
        f"Auto-deletion check completed: {marked_count} images marked for deletion"
    )
    return f"Auto-marked {marked_count} images for deletion based on expiry settings."
