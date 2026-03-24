import datetime
from datetime import timedelta, timezone
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.utils import timezone
from django.db.models import Q

from config.throttles import BurstRateThrottle, SustainedRateThrottle
from sent_images.models import SentImage
from images.models import Image
from frames.models import Frame


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
            user_queryset = SentImage.objects.filter(
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
            latest_image_obj = active_images_to_me.order_by("-expires_at").first()
            if latest_image_obj:
                latest_expiring_image = {
                    "id": latest_image_obj.id,
                    "expires_at": latest_image_obj.expires_at.isoformat(),
                    "sender": latest_image_obj.sender.username,
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
            weekly_activity = []

            for day_info in last_7_days:
                date = day_info["date"]
                day_name = day_info["day_name"]

                # Get start and end of the day - FIXED: Import datetime properly
                start_of_day = timezone.make_aware(
                    datetime.datetime.combine(date, datetime.time.min)
                )
                end_of_day = timezone.make_aware(
                    datetime.datetime.combine(date, datetime.time.max)
                )

                # Count images sent BY me on this day
                sent_by_me = user_queryset.filter(
                    sender=current_user,
                    sent_at__gte=start_of_day,
                    sent_at__lte=end_of_day,
                ).count()

                # Count images received BY me on this day
                received_by_me = user_queryset.filter(
                    reciever=current_user,
                    sent_at__gte=start_of_day,
                    sent_at__lte=end_of_day,
                ).count()

                weekly_activity.append(
                    {
                        "day": day_name,
                        "sent_count": sent_by_me,
                        "received_count": received_by_me,
                    }
                )

            # 4. Frames information
            user_frames = Frame.objects.filter(user=current_user)
            frames_data = []
            for frame in user_frames:
                frames_data.append(
                    {
                        "id": frame.id,
                        "last_seen": (
                            frame.last_seen.isoformat()
                            if frame.last_seen
                            else None
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

        except Exception as e:
            return Response(
                {
                    "detail": f"An error occurred while fetching dashboard stats: {str(e)}"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
