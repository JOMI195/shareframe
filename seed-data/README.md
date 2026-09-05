# Seed data

Deterministic data for the local stacks and the frontend e2e run. One file per
entity, all plain JSON arrays.

Loaded by two management commands, which the backend entrypoint runs whenever
`PRODUCTION` is not `True`:

```bash
python manage.py seed_dev_data     # users, groups, frames, images, friendships, sent images
python manage.py seed_changelogs   # changelogs (needs the frame groups to exist)
```

Both are idempotent — re-running changes nothing — and both refuse to run against
`PRODUCTION=True` without `--allow-production`.

The directory is resolved from `settings.SEED_DATA_DIR`, which defaults to
`<repo>/seed-data` and is overridable with the `SEED_DATA_DIR` env var. The
compose files bind-mount it into the backend container.

## Files

| File | Fields |
|---|---|
| `users.json` | `username`, `email`, `password`, `friendship_code` (8 chars, unique), `friendship_user_searchable` |
| `frame-groups.json` | `name` (unique), `description` |
| `frames.json` | `name`, `seed_b64`, `private_serial_number`, `owner_username` (or `null`), `groups[]`, `version`, `local_ip_address` |
| `images.json` | `display_name`, `owner_username`, `file_name` (under `assets/images/`), `auto_delete_after_period` |
| `friendships.json` | `sender`, `reciever`, `status` (`pending` / `accepted` / `rejected`) |
| `sent-images.json` | `sender`, `reciever`, `image_display_name`, `sent_days_ago`, and either `expires_in_days` or an absolute `expires_at` |
| `changelogs.json` | `title`, `date`, `is_published`, `groups[]`, `content_file_name` (under `assets/changelogs/`) |

`assets/images/` holds small PNGs, `assets/changelogs/` the markdown bodies.

## Invariants

- **Frame serials are derived, not stored.** `seed_b64` must decode to exactly 32
  bytes; the ed25519 public key and the `public_serial_number` are computed from
  it. The command prints every frame's serial and seed at the end so a fake frame
  client can connect.
- **Changelog groups must already exist** — run `seed_dev_data` before
  `seed_changelogs`.
- **Sent images are keyed on (sender, receiver, image)**, so a given pair may not
  share the same photo twice.
- `sent_days_ago` is applied after creation because `sent_at` is `auto_now_add`.
  Relative dates keep the dashboard's weekly-activity chart populated no matter
  when the seed runs.
- Referenced usernames, group names, image display names and asset files must all
  exist; the command fails loudly if they do not.

## What the data is shaped for

`seed_alice` is the account the e2e tests and manual testing use. The other
accounts absorb the destructive e2e specs (`seed_erin` is renamed, `seed_dave`
gets a new password, `seed_mallory` is deleted), so keep them out of new tests
unless the test is meant to change them.

Every password carries a digit on purpose: the change-password form validates the
*current* password against the new-password policy, which requires one.

- **6 users** — alice (main), bob, carol, dave, erin, and one that is not
  searchable, so the friend-code lookup has a negative case.
- **3 frame groups**, so changelog filtering per group is visible.
- **5 frames** — alice owns two, bob and carol one each, and one is unowned so the
  register dialog has something to claim.
- **16 images** — 12 belong to alice, which pushes the gallery past its page size
  of 10 and exercises pagination.
- **6 friendships** — three accepted, one pending *to* alice (so the request badge
  is non-zero), one pending from alice, one rejected.
- **9 sent images** — received, sent, to alice's own frames, active and expired,
  spread over the last week.
- **5 changelogs** — dates spread, one unpublished, groups split.

## Adding data

Append to the matching file and re-run the command. To add a frame, generate a
seed first:

```bash
python -c "import base64, os; print(base64.b64encode(os.urandom(32)).decode())"
```

To add a photo, drop a small PNG into `assets/images/` and reference its file
name. Keep the assets tiny — they are committed.
