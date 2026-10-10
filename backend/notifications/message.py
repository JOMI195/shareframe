from dataclasses import dataclass, field


@dataclass(frozen=True)
class Message:
    title: str
    body: str
    # Frontend path without leading slash, like settings.FRONTEND_*_URL.
    url: str
    cta_label: str
    tag: str = ""
    email_template: str = "notifications/notification.html"
    email_context: dict = field(default_factory=dict)
    # Inline images in the send_django_mail format.
    email_images: list = field(default_factory=list)
