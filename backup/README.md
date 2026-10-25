# Backup

The `backup` service runs [restic](https://restic.net) on a cron schedule (UTC). Each run stores two snapshots, a `pg_dumpall` of Postgres (tag `postgres`) and the media and logs volumes (tag `files`), then applies the retention policy. A weekly `restic check` reads a sample of the stored data.

Each run also writes its result, sizes and failed step to the `backup_metrics` volume, which node-exporter exports. The Grafana `Backup` dashboard and the `backup` alert group read them. Output of scheduled runs goes to Loki, manual `docker exec` runs only print to the terminal.

Configuration lives in the env file (`RESTIC_*`, `BACKUP_*`). `RESTIC_REPOSITORY` picks the target. A local path, `s3:…`, `sftp:…` or `rclone:…` all work without code changes.

Without `RESTIC_PASSWORD` the repository cannot be read. Keep a copy outside the server.

Compose commands below are shortened to `dc`, meaning `docker compose -f <compose file> --env-file <env file>`.

```bash
# run now / check now
docker exec backup backup.sh
docker exec backup backup.sh --check

docker exec backup restic snapshots
```

## Restore

Files land in a staging dir by default:

```bash
docker exec backup restore.sh files latest /tmp/restore
```

In place, with the volume mounted writable for a one-off run:

```bash
dc run --rm --no-deps -v media_volume:/restore/data/media backup restore.sh files latest
```

Database: stop everything that holds a connection first. The script refuses to run while connections are open.

```bash
dc stop backend websockets celery celery-beat
docker exec backup restore.sh db latest
dc start backend websockets celery celery-beat
```

`current user cannot be dropped` and `role "postgres" already exists` are expected. The dump recreates every role, including the one the restore is connected as.
