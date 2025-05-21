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
