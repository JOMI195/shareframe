from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from config.throttles import BurstRateThrottle, SustainedRateThrottle

from .models import SentImage
from .serializers import (
    SentImagesRetrieveSerializer,
)


class SentImagesViewSet(viewsets.ModelViewSet):
    queryset = SentImage.objects.all()
    http_method_names = ["get", "head", "options"]
    permission_classes = [IsAuthenticated]
    serializer_class = SentImagesRetrieveSerializer
    throttle_classes = [BurstRateThrottle, SustainedRateThrottle]

    def get_queryset(self):
        return self.queryset.filter(sender=self.request.user)

    @extend_schema(
        responses={200: SentImagesRetrieveSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        responses={200: SentImagesRetrieveSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        try:
            element = self.get_queryset().get(pk=self.kwargs["pk"])
        except SentImage.DoesNotExist:
            return Response(
                {
                    "detail": "Sent image entry not found or you don't have permission to view it."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(element)
        return Response(serializer.data)
