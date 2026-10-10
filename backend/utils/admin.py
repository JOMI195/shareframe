from django.contrib.admin import helpers
from django.template.response import TemplateResponse


def confirm_page(modeladmin, request, queryset, action, title, warning):
    return TemplateResponse(
        request,
        "admin/confirm_action.html",
        {
            **modeladmin.admin_site.each_context(request),
            "title": title,
            "warning": warning,
            "opts": modeladmin.model._meta,
            "objects": queryset,
            "action": action,
            "action_checkbox_name": helpers.ACTION_CHECKBOX_NAME,
        },
    )


class RowAction:
    """Exposes a bulk admin action as a django-inline-actions row button."""

    def __init__(self, bulk_action, label):
        self.bulk_action = bulk_action
        self.label = label

    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, modeladmin, owner=None):
        if modeladmin is None:
            return self

        def run(request, obj, parent_obj=None):
            queryset = type(obj)._default_manager.filter(pk=obj.pk)
            return self.bulk_action(modeladmin, request, queryset)

        # inline-actions dispatches by the function name
        run.__name__ = self.name
        run.short_description = self.label
        return run
