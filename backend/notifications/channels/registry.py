from ..choices import NotificationChannel
from .email import EmailChannel
from .push import PushChannel

CHANNELS = {
    NotificationChannel.PUSH: PushChannel(),
    NotificationChannel.EMAIL: EmailChannel(),
}
