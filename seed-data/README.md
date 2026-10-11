# Seed data

Deterministic data for the local stacks and the frontend e2e run. One file per
entity, all plain JSON arrays.

Loaded by four management commands, which the backend entrypoint runs whenever
`PRODUCTION` is not `True`:

```bash
python manage.py seed_dev_data     # users, groups, frames, images, friendships, sent images
python manage.py seed_changelogs   # changelogs (needs the frame groups to exist)
python manage.py seed_notifications  # notification opt-outs and history (needs the users to exist)
python manage.py seed_user_stats     # lifetime usage counters (needs the users to exist)
```

All are idempotent — re-running changes nothing — and all refuse to run against
`PRODUCTION=True` without `--allow-production`.

The directory is resolved from `settings.SEED_DATA_DIR`, which defaults to
`<repo>/seed-data` and is overridable with the `SEED_DATA_DIR` env var. The
compose files bind-mount it into the backend container.

## Files

| File | Fields |
|---|---|
| `users.json` | `username`, `email`, `password`, `friendship_code` (8 chars, unique), `friendship_user_searchable`, optional `joined_days_ago`, optional `avatar_file` (under `assets/avatars/`) |
| `frame-groups.json` | `name` (unique), `description` |
| `frames.json` | `name`, `seed_b64`, `private_serial_number`, `owner_username` (or `null`), `groups[]`, `version`, `local_ip_address` |
| `images.json` | `display_name`, `owner_username`, `file_name` (under `assets/images/`), `auto_delete_after_period` |
| `friendships.json` | `sender`, `reciever`, `status` (`pending` / `accepted` / `rejected`) |
| `sent-images.json` | `sender`, `reciever`, `image_display_name`, `sent_days_ago`, either `expires_in_days` or an absolute `expires_at`, optional `scheduled_in_days` |
| `changelogs.json` | `title`, `date`, `is_published`, `groups[]`, `content_file_name` (under `assets/changelogs/`), optional `images[]` of `tag`, `description`, `file_name` (under `assets/changelogs/images/`) |
| `notification-preferences.json` | `username`, `kind`, `channel`, `enabled` |
| `notifications.json` | `username`, `kind`, `channel`, `sent_days_ago` |
| `user-stats.json` | `username`, `images_uploaded`, `images_sent`, `images_received` |

`assets/images/` holds small PNGs, `assets/avatars/` the profile pictures,
`assets/changelogs/` the markdown bodies and `assets/changelogs/images/` the
pictures they embed.

## Invariants

- **Frame serials are derived, not stored.** `seed_b64` must decode to exactly 32
  bytes; the ed25519 public key and the `public_serial_number` are computed from
  it. The command prints every frame's serial and seed at the end so a fake frame
  client can connect.
- **Changelog groups must already exist** — run `seed_dev_data` before
  `seed_changelogs`.
- **Notification accounts must already exist** — run `seed_dev_data` before
  `seed_notifications`.
- **User stats only fill rows that are still all zero.** The entrypoint's
  `init_user_stats` creates zeroed rows first, and a row with live counts is
  never reset.
- **Notification channels are never seeded.** Every kind and channel starts
  switched off and is enabled by hand in the admin under Channel settings.
- **Every changelog image must be placed in its body** as `::tag::`, otherwise
  `seed_changelogs` fails. That placeholder is where the picture is shown.
- **Profile pictures are only set when the account has none**, so a picture
  changed by hand survives a re-seed. They go through the same crop as an upload.
- **Sent images are keyed on (sender, receiver, image)**, so a given pair may not
  share the same photo twice.
- `sent_days_ago` is applied after creation, so existing rows are back-dated too.
  Relative dates keep the dashboard's weekly-activity chart populated no matter
  when the seed runs. `joined_days_ago` and the notification `sent_days_ago` work
  the same way, but `joined_days_ago` is only applied when the user is created.
- **A scheduled sent image** has `scheduled_in_days`, and its `expires_in_days`
  counts from that time. Once the beat task delivers it, re-seeding leaves it sent.
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
- **Profile pictures** for alice, bob, carol and erin. dave and mallory have
  none, so the initials fallback shows (dave's request to alice), and dave and
  carol share nothing, so dave may not load carol's picture. erin's is not
  square, so seeding exercises the crop.
- **3 frame groups**, so changelog filtering per group is visible.
- **5 frames** — alice owns two, bob and carol one each, and one is unowned so the
  register dialog has something to claim.
- **16 images** — 12 belong to alice, which pushes the gallery past its page size
  of 10 and exercises pagination.
- **6 friendships** — three accepted, one pending *to* alice (so the request badge
  is non-zero), one pending from alice, one rejected.
- **12 sent images** — received, sent, to alice's own frames, active and expired,
  spread over the last week. Three are still scheduled, two by alice and one
  from bob to carol that alice never sees.
- **5 changelogs** — dates spread, one unpublished, groups split. One carries a
  picture and one carries two, so the in-app dialog and the changelog email show images.
- **Lifetime counters** for everyone except dave. They are higher than the
  seeded images and sends because deleted photos and expired sends still
  count. `seed_mallory` has a row too, so the admin shows an unlinked one
  once the e2e run deletes her.
- **Inactivity reminder** — once the admin enables a channel, `seed_dave` is due
  (joined a month ago, never sent), `seed_erin` is skipped (already reminded in
  this stretch) and everyone else sent recently or just joined. `seed_alice` has an old
  reminder in her history. `seed_bob` opted out of the reminder by mail.

## Adding data

Append to the matching file and re-run the command. To add a frame, generate a
seed first:

```bash
python -c "import base64, os; print(base64.b64encode(os.urandom(32)).decode())"
```

To add a photo, drop a small PNG into `assets/images/` and reference its file
name. Profile pictures work the same way with `assets/avatars/` and `avatar_file`. Keep the assets tiny — they are committed.
