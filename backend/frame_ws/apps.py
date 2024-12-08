from django.apps import AppConfig


class FrameWsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "frame_ws"

    def ready(self):
        import frame_ws.signals
