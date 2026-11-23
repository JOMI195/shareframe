def _header(request, name):
    value = request.META.get(name, "").strip()
    # WSGI/ASGI hand header bytes over as latin-1, nginx sends UTF-8.
    try:
        return value.encode("latin-1").decode("utf-8")
    except UnicodeError:
        return value


def client_location(request):
    if request is None:
        return None

    city = _header(request, "HTTP_X_GEOIP_CITY")
    country = _header(request, "HTTP_X_GEOIP_COUNTRY")
    if city.lower() == "unknown":
        city = ""
    return city or country or None
