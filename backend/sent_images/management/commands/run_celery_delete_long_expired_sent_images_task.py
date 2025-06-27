import os
from django.core.management.base import BaseCommand
from sent_images.tasks import delete_long_expired_sent_images


class Command(BaseCommand):
    help = "Delete sent images that expired more than the defined days ago."

    def handle(self, *args, **kwargs):
        self.stdout.write(
            self.style.WARNING("Starting task to delete long expired sent-images...")
        )
        task_result = delete_long_expired_sent_images.delay()

        self.stdout.write(
            self.style.WARNING(f"Task started. Task ID: {task_result.id}")
        )
        self.stdout.write(self.style.WARNING("Waiting for result..."))

        # wait for result
        result = task_result.get(timeout=300)

        self.stdout.write(self.style.SUCCESS(f"Task completed. Result: {result}"))
