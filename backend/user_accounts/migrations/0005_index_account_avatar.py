import user_accounts.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user_accounts', '0004_account_avatar'),
    ]

    operations = [
        migrations.AlterField(
            model_name='account',
            name='avatar',
            field=models.ImageField(blank=True, db_index=True, upload_to=user_accounts.models.avatar_upload_path),
        ),
    ]
