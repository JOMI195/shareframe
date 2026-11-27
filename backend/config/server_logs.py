import logging
import os
import tarfile
import time
from pathlib import Path

from django.conf import settings
from django.contrib import admin
from django.core.cache import cache
from django.core.exceptions import PermissionDenied
from django.http import FileResponse, HttpResponse
from django.template.response import TemplateResponse
from django.utils import timezone

logger = logging.getLogger("admin.audit")

ARCHIVE_DIR = "server_logs"
READY_COOKIE = "server_logs_ready"
BUILD_LOCK = "server_logs_build"
BUILD_LOCK_TIMEOUT = 300


def archive_dir():
    return Path(settings.MEDIA_ROOT) / ARCHIVE_DIR


def delete_server_logs(older_than=None):
    directory = archive_dir()
    if not directory.is_dir():
        return 0
    cutoff = time.time() - older_than.total_seconds() if older_than else None
    deleted = 0
    for archive in directory.iterdir():
        if cutoff is None or archive.stat().st_mtime < cutoff:
            archive.unlink(missing_ok=True)
            deleted += 1
    return deleted


class _SnapshotReader:
    """Yields exactly `size` bytes; pads with NUL if copytruncate shrank the file."""

    def __init__(self, fileobj, size):
        self.fileobj = fileobj
        self.left = size

    def read(self, n=-1):
        n = self.left if n is None or n < 0 else min(n, self.left)
        data = self.fileobj.read(n)
        data += b"\0" * (n - len(data))
        self.left -= n
        return data


def _log_files():
    files = [p for p in Path(settings.LOGS_DIR).iterdir() if p.is_file()]
    # Live files first so the budget keeps what is most recent.
    return sorted(files, key=lambda p: (p.suffix != ".log", p.name))


def build_archive(path):
    budget = settings.SERVER_LOGS_MAX_TOTAL_BYTES
    with tarfile.open(path, "w:gz", compresslevel=1) as tar:
        for log_file in _log_files():
            try:
                fileobj = log_file.open("rb")
            except FileNotFoundError:
                continue
            with fileobj:
                stat = os.fstat(fileobj.fileno())
                size = min(stat.st_size, settings.SERVER_LOGS_MAX_FILE_BYTES, budget)
                truncated = size < stat.st_size
                if truncated and (size <= 0 or log_file.suffix == ".gz"):
                    continue
                fileobj.seek(stat.st_size - size)
                info = tarfile.TarInfo(log_file.name)
                info.size = size
                info.mtime = stat.st_mtime
                tar.addfile(info, _SnapshotReader(fileobj, size))
                budget -= size


def _confirm_page(request, busy=False):
    return TemplateResponse(
        request,
        "admin/confirm_server_logs.html",
        {
            **admin.site.each_context(request),
            "title": "Download server logs",
            "ready_cookie": READY_COOKIE,
            "busy": busy,
        },
        status=409 if busy else 200,
    )


def download_server_logs(request):
    if not request.user.is_admin:
        raise PermissionDenied
    if request.method != "POST":
        return _confirm_page(request)
    if not cache.add(BUILD_LOCK, 1, BUILD_LOCK_TIMEOUT):
        return _confirm_page(request, busy=True)
    try:
        delete_server_logs()
        directory = archive_dir()
        directory.mkdir(parents=True, exist_ok=True)
        filename = f"server_logs-{timezone.localtime():%Y%m%d-%H%M%S}.tar.gz"
        build_archive(directory / filename)
    finally:
        cache.delete(BUILD_LOCK)
    logger.info("Server logs downloaded by %s", request.user.email)

    if settings.DEBUG:
        response = FileResponse(
            open(directory / filename, "rb"), as_attachment=True, filename=filename
        )
    else:
        # nginx serves the file from its internal location (protected media).
        response = HttpResponse(content_type="application/gzip")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        response["X-Accel-Redirect"] = f"/api/media/protected/{ARCHIVE_DIR}/{filename}"
    # Tells the confirm page the download started, so it can leave.
    response.set_cookie(READY_COOKIE, "1", max_age=60, samesite="Lax")
    return response
