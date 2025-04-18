import os
from django.core.management.base import BaseCommand
from frames.tasks import close_and_delete_long_inactive_frame_websocket_connections


class Command(BaseCommand):
    help = "Closes and deletes frameWebsocketConnections with frames that haven't sent heartbeats in a long time."

    def handle(self, *args, **kwargs):
        self.stdout.write(
            self.style.WARNING(
                "Starting task to closes and delete frameWebsocketConnections with frames that haven't sent heartbeats in a long time...."
            )
        )
        task_result = close_and_delete_long_inactive_frame_websocket_connections.delay()

        self.stdout.write(
            self.style.WARNING(f"Task started. Task ID: {task_result.id}")
        )
        self.stdout.write(self.style.WARNING("Waiting for result..."))

        # wait for result
        result = task_result.get(timeout=300)

        self.stdout.write(self.style.SUCCESS(f"Task completed. Result: {result}"))
