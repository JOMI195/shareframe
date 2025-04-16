from config.celery import celery
from .models import Image
from sent_images.models import SentImage


@celery.task
def delete_marked_as_deleted_images_without_sent_images():
    """Delete images which are marked as deleted and dont have corresponding sentImages"""
    images_marked_as_deleted = Image.objects.filter(markedAsDeleted=True)

    deleteCount = 0
    for image in images_marked_as_deleted:
        corresp_sent_images = SentImage.objects.filter(image=image)
        if not corresp_sent_images.exists():
            image.delete()
            deleteCount += 1
    return f"Deleted {deleteCount} images which are marked as deleted and dont have corresponding sentImages."
