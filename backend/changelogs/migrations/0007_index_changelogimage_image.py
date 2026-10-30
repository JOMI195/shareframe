import changelogs.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('changelogs', '0006_rename_email_sent_at_changelog_notified_at'),
    ]

    operations = [
        migrations.AlterField(
            model_name='changelogimage',
            name='image',
            field=models.ImageField(db_index=True, upload_to=changelogs.models.changelog_image_upload_path),
        ),
    ]
