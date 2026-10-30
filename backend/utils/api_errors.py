from rest_framework.response import Response


def error_response(code, detail, status):
    return Response({"detail": detail, "code": code}, status=status)
