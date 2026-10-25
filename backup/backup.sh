#!/bin/sh
set -euo pipefail

METRICS=/metrics
STEPS="unlock postgres files forget stats"

log() { echo "[backup] $*"; }

# node-exporter reads every *.prom, so a file must never be seen half-written
publish() {
  grep . > "$METRICS/.$1.tmp" || true
  mv "$METRICS/.$1.tmp" "$METRICS/$1"
}

previous() {
  grep -E "$2" "$METRICS/$1" 2>/dev/null || true
}

if [ "${1:-}" = --check ]; then
  now=$(date +%s)
  ok=0
  log "check started"
  if restic check --read-data-subset="$BACKUP_CHECK_SUBSET"; then
    ok=1
    last="shareframe_backup_check_last_success_timestamp_seconds $now"
    log "check finished"
  else
    last=$(previous check.prom '^shareframe_backup_check_last_success_timestamp_seconds ')
    log "check failed"
  fi
  printf '%s\n' \
    "shareframe_backup_check_last_run_timestamp_seconds $now" \
    "shareframe_backup_check_last_run_success $ok" \
    "$last" | publish check.prom
  [ "$ok" = 1 ]
  exit
fi

start=$(date +%s)
data=$(mktemp)
completed=""

finish() {
  rc=$1
  now=$(date +%s)
  if [ "$rc" -eq 0 ]; then
    ok=1
    last="shareframe_backup_last_success_timestamp_seconds $now"
    values=$(cat "$data")
    log "finished in $((now - start))s"
  else
    ok=0
    last=$(previous backup.prom '^shareframe_backup_last_success_timestamp_seconds ')
    values=$(previous backup.prom '^shareframe_backup_(bytes|files|repo|snapshots)')
    log "failed at step $step"
  fi
  {
    echo "shareframe_backup_last_run_timestamp_seconds $now"
    echo "shareframe_backup_last_run_success $ok"
    echo "shareframe_backup_duration_seconds $((now - start))"
    echo "$last"
    for s in $STEPS; do
      case " $completed " in
        *" $s "*) echo "shareframe_backup_step_success{step=\"$s\"} 1" ;;
        *) echo "shareframe_backup_step_success{step=\"$s\"} 0" ;;
      esac
    done
    echo "$values"
  } | publish backup.prom
  rm -f "$data"
}

trap 'finish $?' EXIT

snapshot() {
  tag=$1
  shift
  summary=$(restic backup --json --quiet --tag "$tag" "$@" | jq -c 'select(.message_type == "summary")')
  echo "$summary" | jq -r --arg t "$tag" \
    '"\($t): \(.total_files_processed) files, \(.total_bytes_processed / 1048576 * 100 | round / 100) MiB processed, \(.data_added / 1048576 * 100 | round / 100) MiB added, snapshot \(.snapshot_id[:8])"' \
    | while read -r line; do log "$line"; done
  echo "$summary" | jq -r --arg t "$tag" '
    "shareframe_backup_bytes_processed{tag=\"\($t)\"} \(.total_bytes_processed)",
    "shareframe_backup_bytes_added{tag=\"\($t)\"} \(.data_added)",
    "shareframe_backup_files_processed{tag=\"\($t)\"} \(.total_files_processed)"' >> "$data"
}

log "started"

step=unlock
restic unlock
completed="$completed $step"

step=postgres
snapshot postgres --stdin-filename postgres.sql \
  --stdin-from-command -- pg_dumpall --clean --if-exists
completed="$completed $step"

step=files
snapshot files /data
completed="$completed $step"

step=forget
restic forget --prune --quiet --group-by host,tags \
  --keep-daily "$RESTIC_KEEP_DAILY" \
  --keep-weekly "$RESTIC_KEEP_WEEKLY" \
  --keep-monthly "$RESTIC_KEEP_MONTHLY"
completed="$completed $step"

step=stats
# stats prints a progress line before the JSON, even with --quiet
restic stats --quiet --mode raw-data --json | tail -n 1 | jq -r '
  "shareframe_backup_repo_size_bytes \(.total_size)",
  "shareframe_backup_snapshots \(.snapshots_count)"' >> "$data"
completed="$completed $step"
