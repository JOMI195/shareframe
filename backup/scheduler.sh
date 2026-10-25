#!/bin/sh
set -eu

cat > /tmp/crontab <<CRON
$BACKUP_SCHEDULE backup.sh
$BACKUP_CHECK_SCHEDULE backup.sh --check
CRON

rc=0
restic cat config >/dev/null 2>&1 || rc=$?
case $rc in
  0) ;;
  10) echo "[backup] initializing repository"; restic init ;;
  # keep running, the scheduled runs report the failure
  *) echo "[backup] repository not readable (restic exit $rc)" ;;
esac

if [ "$BACKUP_ON_START" = true ]; then
  backup.sh || true
fi

exec supercronic -passthrough-logs /tmp/crontab
