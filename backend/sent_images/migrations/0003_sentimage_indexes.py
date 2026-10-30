from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sent_images', '0002_sentimage_scheduled_for_sentimage_status_and_more'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='sentimage',
            index=models.Index(fields=['reciever', 'status', 'expires_at'], name='sentimage_reciever_status_exp'),
        ),
        migrations.AddIndex(
            model_name='sentimage',
            index=models.Index(fields=['expires_at'], name='sentimage_expires_at'),
        ),
        migrations.AddIndex(
            model_name='sentimage',
            index=models.Index(condition=models.Q(('status', 'scheduled')), fields=['scheduled_for'], name='sentimage_scheduled_for'),
        ),
    ]
