from django.contrib import admin
from django.db.models import Sum

from notifications.admin import ReadOnlyAdmin

from .models import UserStats


@admin.register(UserStats)
class UserStatsAdmin(ReadOnlyAdmin):
    list_display = ("__str__", *UserStats.COUNTERS, "updated_at")
    list_filter = (("user", admin.EmptyFieldListFilter),)
    search_fields = ("user__email", "user__username")
    ordering = ("-images_sent",)

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        response = super().changelist_view(request, extra_context)
        context = getattr(response, "context_data", None)
        if context and "cl" in context:
            sums = context["cl"].queryset.aggregate(
                **{field: Sum(field) for field in UserStats.COUNTERS}
            )
            context["totals"] = [
                (UserStats._meta.get_field(field).verbose_name, sums[field] or 0)
                for field in UserStats.COUNTERS
            ]
        return response
