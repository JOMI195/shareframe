from django.db import migrations, models


def merge_timestamps_forward(apps, schema_editor):
    Frame = apps.get_model("frames", "Frame")
    for frame in Frame.objects.all():
        candidates = [frame.last_active, frame.last_board_heartbeat]
        valid = [ts for ts in candidates if ts is not None]
        frame.last_seen = max(valid) if valid else None
        frame.save(update_fields=["last_seen"])


def merge_timestamps_reverse(apps, schema_editor):
    Frame = apps.get_model("frames", "Frame")
    for frame in Frame.objects.all():
        frame.last_active = frame.last_seen
        frame.last_board_heartbeat = frame.last_seen
        frame.save(update_fields=["last_active", "last_board_heartbeat"])


class Migration(migrations.Migration):

    dependencies = [
        ("frames", "0008_framegroup_frame_groups"),
    ]

    operations = [
        migrations.AddField(
            model_name="frame",
            name="last_seen",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="frame",
            name="last_connected",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(
            merge_timestamps_forward,
            merge_timestamps_reverse,
        ),
        migrations.RemoveField(
            model_name="frame",
            name="last_active",
        ),
        migrations.RemoveField(
            model_name="frame",
            name="last_board_heartbeat",
        ),
    ]
