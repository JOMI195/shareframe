from django import forms

from .models import Frame


class FrameAdminForm(forms.ModelForm):
    class Meta:
        model = Frame
        fields = (
            "user",
            "is_active",
            "groups",
            "public_key",
            "private_serial_number",
        )
        help_texts = {
            "public_key": "Paste the public key printed by gen-device-key.sh "
            "(shareframe-hardware). The frame id is derived from it.",
            "private_serial_number": "Legacy boards only. Left blank, a random one is set.",
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Legacy HMAC frames have no key and must stay editable.
        self.fields["public_key"].required = self.instance.pk is None
        self.fields["private_serial_number"].required = False
