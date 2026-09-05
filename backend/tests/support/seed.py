"""The seeded world, read straight from seed-data/ so the two never drift.

seed_alice is the default subject; the others absorb the destructive cases.
"""

import json
from functools import lru_cache

from django.conf import settings

ALICE = "seed_alice"
BOB = "seed_bob"
CAROL = "seed_carol"
DAVE = "seed_dave"
ERIN = "seed_erin"
MALLORY = "seed_mallory"


@lru_cache(maxsize=None)
def _load(name):
    with open(settings.SEED_DATA_DIR / f"{name}.json") as f:
        return json.load(f)


def users():
    return {entry["username"]: entry for entry in _load("users")}


def user(username):
    return users()[username]


def credentials(username):
    entry = user(username)
    return entry["email"], entry["password"]


def frames():
    return {entry["name"]: entry for entry in _load("frames")}


def frames_of(username):
    return [f for f in _load("frames") if f["owner_username"] == username]


def unowned_frame():
    return next(f for f in _load("frames") if f["owner_username"] is None)


def frame_groups():
    return _load("frame-groups")


def images():
    return _load("images")


def images_of(username):
    return [i for i in _load("images") if i["owner_username"] == username]


def friendships():
    return _load("friendships")


def sent_images():
    return _load("sent-images")


def changelogs():
    return _load("changelogs")


def assets_dir():
    return settings.SEED_DATA_DIR / "assets"
