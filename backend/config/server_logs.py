import io
import logging
import tarfile
import time
from pathlib import Path

from django.conf import settings
from django.contrib import admin
from django.core.exceptions import PermissionDenied
from django.http import FileResponse, HttpResponse
from django.template.response import TemplateResponse
from django.utils import timezone

logger = logging.getLogger("admin.audit")

ARCHIVE_DIR = "server_logs"
READY_COOKIE = "server_logs_ready"


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


def build_archive(path):
    with tarfile.open(path, "w:gz", compresslevel=1) as tar:
        for log_file in sorted(Path(settings.LOGS_DIR).iterdir()):
            if not log_file.is_file():
                continue
            # Read up front: copytruncate can shrink a file while tarfile streams it.
            try:
                data = log_file.read_bytes()
                mtime = log_file.stat().st_mtime
            except FileNotFoundError:
                continue
            info = tarfile.TarInfo(log_file.name)
            info.size = len(data)
            info.mtime = mtime
            tar.addfile(info, io.BytesIO(data))


def download_server_logs(request):
    if not request.user.is_admin:
        raise PermissionDenied
    if request.method != "POST":
        return TemplateResponse(
            request,
            "admin/confirm_server_logs.html",
            {
                **admin.site.each_context(request),
                "title": "Download server logs",
                "ready_cookie": READY_COOKIE,
            },
        )
    delete_server_logs()
    directory = archive_dir()
    directory.mkdir(parents=True, exist_ok=True)
    filename = f"server_logs-{timezone.localtime():%Y%m%d-%H%M%S}.tar.gz"
    build_archive(directory / filename)
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
