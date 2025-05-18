from django import forms
from .models import Changelog


class ChangelogAdminForm(forms.ModelForm):
    content_text = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 20, "cols": 100}),
        required=False,
        label="Markdown Content",
        help_text="Edit the content of the markdown file directly.",
    )

    class Meta:
        model = Changelog
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.content_file:
            try:
                self.fields["content_text"].initial = (
                    self.instance.get_markdown_content()
                )
            except Exception:
                self.fields["content_text"].initial = ""

    def save(self, commit=True):
        instance = super().save(commit=False)
        content = self.cleaned_data.get("content_text")

        if content:
            # Save the edited content back into the file
            if not instance.content_file:
                from django.core.files.base import ContentFile
                import time

                filename = (
                    f"{instance.title.lower().replace(' ', '_')}_{int(time.time())}.md"
                )
                instance.content_file.save(filename, ContentFile(content), save=False)
            else:
                # Overwrite the existing file content
                instance.content_file.open("w")
                instance.content_file.write(content)
                instance.content_file.close()

        if commit:
            instance.save()
        return instance
