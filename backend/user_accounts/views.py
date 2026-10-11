from django.db import transaction
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from config.throttles import ImagesBurstRateThrottle, ImagesSustainedRateThrottle
from user_core.serializers import UserRetrievePatchSerializer

from .avatars import InvalidAvatar, clear_avatar, set_avatar
from .serializers import AvatarUploadSerializer


class AvatarView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    throttle_classes = [ImagesBurstRateThrottle, ImagesSustainedRateThrottle]

    def put(self, request):
        serializer = AvatarUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                set_avatar(request.user.account, serializer.validated_data["avatar"])
        except InvalidAvatar as e:
            raise ValidationError({"avatar": ["The file is not a valid image"]}) from e
        return Response(self._me(request))

    def delete(self, request):
        with transaction.atomic():
            clear_avatar(request.user.account)
        return Response(self._me(request))

    def _me(self, request):
        return UserRetrievePatchSerializer(
            request.user, context={"request": request}
        ).data
