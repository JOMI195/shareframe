import datetime
import logging
from datetime import timedelta

from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from config.throttles import BurstRateThrottle, SustainedRateThrottle
from frames.models import Frame
from images.models import Image
from sent_images.models import SentImage
from user_accounts.avatars import avatar_url

logger = logging.getLogger("django.request")


class DashboardAPIViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    throttle_classes = [BurstRateThrottle, SustainedRateThrottle]

    @action(detail=False, methods=["GET"], url_path="statistics")
    def dashboard_stats(self, request):
        """
        Get dashboard statistics including:
        - Count of active images sent to current user
        - Latest expiring image sent to current user
        - Weekly activity data (last 7 days starting from Monday)
        """
        try:
            current_user = request.user
            now = timezone.now()

            # Get base queryset for current user
            user_queryset = SentImage.objects.sent().filter(
                Q(sender=current_user) | Q(reciever=current_user)
            )

            # Dashboard Stats
            # 1. Count of images uploaded by me
            uploaded_images_by_me_count = Image.objects.filter(
                user=current_user, markedAsDeleted=False
            ).count()

            # 2. Count of active images sent TO me
            active_images_to_me = user_queryset.filter(
                reciever=current_user, expires_at__gt=now
            )
            active_images_to_me_count = active_images_to_me.count()

            # 3. Latest expiring image sent TO me
            latest_expiring_image = None
            latest_image_obj = (
                active_images_to_me.select_related("sender__account", "image")
                .order_by("-expires_at")
                .first()
            )
            if latest_image_obj:
                latest_expiring_image = {
                    "id": latest_image_obj.id,
                    "expires_at": latest_image_obj.expires_at.isoformat(),
                    "sender": latest_image_obj.sender.username,
                    "sender_avatar": avatar_url(latest_image_obj.sender),
                    "image_name": (
                        getattr(latest_image_obj.image, "name", "Unknown")
                        if hasattr(latest_image_obj, "image")
                        else "Unknown"
                    ),
                }

            # Weekly Activity Data (last 7 days starting from Monday)
            def get_last_7_days():
                """Get the last 7 days starting from Monday"""
                today = now.date()
                day_of_week = today.weekday()  # 0 is Monday, 6 is Sunday

                # Calculate start of current week (Monday)
                start_of_week = today - timedelta(days=day_of_week)

                # European/German day names
                day_names = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]

                days = []
                for i in range(7):
                    date = start_of_week + timedelta(days=i)
                    days.append({"date": date, "day_name": day_names[i]})
                return days

            last_7_days = get_last_7_days()
            week_start = timezone.make_aware(
                datetime.datetime.combine(last_7_days[0]["date"], datetime.time.min)
            )
            week_end = timezone.make_aware(
                datetime.datetime.combine(last_7_days[-1]["date"], datetime.time.max)
            )
            counts_by_day = {
                row["day"]: row
                for row in user_queryset.filter(
                    sent_at__gte=week_start, sent_at__lte=week_end
                )
                .annotate(day=TruncDate("sent_at"))
                .values("day")
                .annotate(
                    sent=Count("id", filter=Q(sender=current_user)),
                    received=Count("id", filter=Q(reciever=current_user)),
                )
            }
            no_activity = {"sent": 0, "received": 0}
            weekly_activity = []
            for day_info in last_7_days:
                counts = counts_by_day.get(day_info["date"], no_activity)
                weekly_activity.append(
                    {
                        "day": day_info["day_name"],
                        "sent_count": counts["sent"],
                        "received_count": counts["received"],
                    }
                )

            # 4. Frames information
            user_frames = Frame.objects.filter(user=current_user, is_active=True)
            frames_data = []
            for frame in user_frames:
                frames_data.append(
                    {
                        "id": frame.id,
                        "last_seen": (
                            frame.last_seen.isoformat() if frame.last_seen else None
                        ),
                    }
                )

            return Response(
                {
                    "images": {
                        "uploaded_images_by_me_count": uploaded_images_by_me_count,
                    },
                    "sent_images": {
                        "active_images_to_me_count": active_images_to_me_count,
                        "latest_expiring_image": latest_expiring_image,
                        "weekly_activity": weekly_activity,
                    },
                    "frames": frames_data,
                }
            )

        except Exception:
            logger.exception("Dashboard stats failed")
            return Response(
                {"detail": "An error occurred while fetching dashboard stats."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
