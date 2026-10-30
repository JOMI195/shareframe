import images.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('images', '0007_textpreset_width'),
    ]

    operations = [
        migrations.AlterField(
            model_name='image',
            name='image',
            field=models.ImageField(db_index=True, upload_to=images.models.get_original_upload_path),
        ),
        migrations.AlterField(
            model_name='imagevariant',
            name='file',
            field=models.ImageField(db_index=True, upload_to=images.models.get_variant_upload_path),
        ),
    ]
