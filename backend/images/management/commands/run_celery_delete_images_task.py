import os
from django.core.management.base import BaseCommand
from images.tasks import delete_marked_as_deleted_images_without_sent_images


class Command(BaseCommand):
    help = "Deletes images marked as deleted without associated SentImages."

    def handle(self, *args, **kwargs):
        self.stdout.write(
            self.style.WARNING("Starting task to delete marked images...")
        )
        task_result = delete_marked_as_deleted_images_without_sent_images.delay()

        self.stdout.write(
            self.style.WARNING(f"Task started. Task ID: {task_result.id}")
        )
        self.stdout.write(self.style.WARNING("Waiting for result..."))

        # wait for result
        result = task_result.get(timeout=300)

        self.stdout.write(self.style.SUCCESS(f"Task completed. Result: {result}"))
