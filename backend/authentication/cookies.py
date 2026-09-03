from django.conf import settings


def set_auth_cookies(response, access=None, refresh=None):
    common = {
        "httponly": True,
        "secure": settings.AUTH_COOKIE_SECURE,
        "samesite": settings.AUTH_COOKIE_SAMESITE,
    }
    if access is not None:
        response.set_cookie(
            settings.AUTH_COOKIE_ACCESS_NAME,
            access,
            max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
            path=settings.AUTH_COOKIE_ACCESS_PATH,
            **common,
        )
    if refresh is not None:
        response.set_cookie(
            settings.AUTH_COOKIE_REFRESH_NAME,
            refresh,
            max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
            path=settings.AUTH_COOKIE_REFRESH_PATH,
            **common,
        )
    return response


def delete_auth_cookies(response):
    # Browsers match on name+path; must mirror set_auth_cookies.
    response.delete_cookie(
        settings.AUTH_COOKIE_ACCESS_NAME,
        path=settings.AUTH_COOKIE_ACCESS_PATH,
        samesite=settings.AUTH_COOKIE_SAMESITE,
    )
    response.delete_cookie(
        settings.AUTH_COOKIE_REFRESH_NAME,
        path=settings.AUTH_COOKIE_REFRESH_PATH,
        samesite=settings.AUTH_COOKIE_SAMESITE,
    )
    return response
