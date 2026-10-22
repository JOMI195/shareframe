from django.conf import settings


def build_version(request):
    return {"app_build_version": settings.APP_BUILD_VERSION}
