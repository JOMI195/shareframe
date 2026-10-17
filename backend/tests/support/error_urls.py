from django.urls import path

from config.urls import handler500  # noqa: F401
from config.urls import urlpatterns as app_urlpatterns


def _raise(request):
    raise RuntimeError("internal detail")


urlpatterns = [*app_urlpatterns, path("api/boom/", _raise)]
