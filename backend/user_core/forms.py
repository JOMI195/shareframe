from django import forms
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from .validation import is_username_allowed
from .models import User
from django.urls import reverse


class UserChangeForm(forms.ModelForm):
    """A form for updating users."""

    password = ReadOnlyPasswordHashField()

    class Meta:
        model = User
        fields = (
            "email",
            "username",
            "password",
            "is_active",
            "is_staff",
            "is_superuser",
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            self.fields["password"].help_text = (
                f"Raw passwords are not stored, so there is no way to see this user's password, "
                f"but you can change the password using <a href=\"{reverse('admin:auth_user_password_change', args=[self.instance.pk])}\">this form</a>."
            )

    def clean_password(self):
        """Return the initial value of the password field."""
        return self.initial["password"]


class UserCreationForm(forms.ModelForm):
    """A form for creating new users."""

    password1 = forms.CharField(label="Password", widget=forms.PasswordInput)
    password2 = forms.CharField(
        label="Password confirmation", widget=forms.PasswordInput
    )

    class Meta:
        model = User
        fields = ("email", "username", "is_active", "is_staff")

    def clean_password2(self):
        """Check that the two password entries match."""
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords don't match")
        return password2

    def clean(self):
        cleaned_data = super().clean()
        username = cleaned_data.get("username")

        if username and not is_username_allowed(username):
            raise forms.ValidationError(
                "The username contains sensitive or problematic terms."
            )

        return cleaned_data

    def save(self, commit=True):
        """Save the user with the provided password."""
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user
