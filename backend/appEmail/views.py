from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from config.throttles import ContactBurstRateThrottle, ContactSustainedRateThrottle

from .serializers import ContactSerializer
from .tasks import send_contact_mail


class ContactView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ContactBurstRateThrottle, ContactSustainedRateThrottle]

    def post(self, request):
        serializer = ContactSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # The message is personal data, so the result backend keeps none of it.
        send_contact_mail.apply_async(kwargs=serializer.validated_data, kwargsrepr="{}")
        return Response({"detail": "ok"})
