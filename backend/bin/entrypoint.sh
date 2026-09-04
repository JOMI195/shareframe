#!/bin/sh

echo "Migrating the database..."
python manage.py migrate


# echo "Translating content..."
# django-admin makemessages
# django-admin compilemessages


echo "Collecting static files..."
python manage.py collectstatic --noinput

if [ "$DJANGO_SUPERUSER_EMAIL" ]
then
echo "Creating superuser..."
python manage.py createsuperuser --noinput
fi

if [ -n "$PRODUCTION" ]; then
  if [ "$PRODUCTION" = "True" ]; then
    echo "PRODUCTION is set to 'True', skipping adding fixtures."
  else
    echo "Adding fixtures..."
    python manage.py create_image_sizes
    echo "Seeding deterministic dev/local test data..."
    python manage.py seed_dev_data
    python manage.py seed_changelogs
  fi
else
  echo "PRODUCTION is not set, skipping adding fixtures."
fi

exec "$@"
