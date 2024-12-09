from django.apps import AppConfig


class FramesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "frames"

    def ready(self):
        import frames.signals
