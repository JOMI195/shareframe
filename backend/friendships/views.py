from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from config import error_codes
from config.throttles import BurstRateThrottle, SustainedRateThrottle
from user_core.models import User
from utils.api_errors import error_response

from .models import Friendship
from .serializers import (
    FriendshipCreateSerializer,
    FriendshipDestroySerializer,
    FriendshipRetrieveSerializer,
)


class FriendshipViewSet(viewsets.ModelViewSet):
    queryset = Friendship.objects.select_related("sender__account", "reciever__account")
    http_method_names = ["get", "post", "delete", "head", "options"]
    permission_classes = [IsAuthenticated]
    throttle_classes = [BurstRateThrottle, SustainedRateThrottle]

    def get_serializer_class(self):
        if self.action == "list":
            return FriendshipRetrieveSerializer
        if self.action == "retrieve":
            return FriendshipRetrieveSerializer
        elif self.action == "destroy":
            return FriendshipDestroySerializer
        return self.serializer_class

    def get_queryset(self):
        return self.queryset.filter(
            Q(sender=self.request.user) | Q(reciever=self.request.user)
        )

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        try:
            element = self.get_queryset().get(pk=self.kwargs["pk"])
        except Friendship.DoesNotExist:
            return error_response(
                error_codes.FRIENDSHIP_NOT_FOUND,
                "Friendship not found or you don't have permission to view it.",
                status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(element)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def destroy(self, request, *args, **kwargs):
        pk_to_delete = self.kwargs["pk"]
        try:
            element = self.get_queryset().get(pk=self.kwargs["pk"])
        except Friendship.DoesNotExist:
            return error_response(
                error_codes.FRIEND_REQUEST_GONE,
                "The friendship request could not be found. It may have already been accepted, rejected, or you may not have permission to respond to it.",
                status.HTTP_400_BAD_REQUEST,
            )

        serializer = FriendshipRetrieveSerializer(element)
        response_data = serializer.data
        response_data["id"] = pk_to_delete
        element.delete()
        return Response(response_data)

    @action(detail=False, methods=["POST"], url_path="send-request")
    def send_request(self, request):
        reciever_friendship_user_search_code = request.data.get(
            "reciever_friendship_user_search_code"
        )

        try:
            reciever = User.objects.get(
                account__friendship_user_searchable=True,
                account__friendship_user_search_code=reciever_friendship_user_search_code,
            )
        except User.DoesNotExist:
            return error_response(
                error_codes.FRIEND_CODE_UNKNOWN,
                "Reciever not found or invalid reciever friendship user search code.",
                status.HTTP_400_BAD_REQUEST,
            )

        if reciever == request.user:
            return error_response(
                error_codes.FRIEND_REQUEST_SELF,
                "Friendship request to yourself not possible",
                status.HTTP_400_BAD_REQUEST,
            )

        existing_requests = Friendship.objects.filter(
            sender=request.user, reciever=reciever
        )

        existing_pending_request = existing_requests.filter(status="pending").exists()
        if existing_pending_request:
            return error_response(
                error_codes.FRIEND_REQUEST_PENDING,
                "Friendship request already sent",
                status.HTTP_400_BAD_REQUEST,
            )

        existing_friendship = self.queryset.filter(
            (Q(sender=self.request.user) & Q(reciever=reciever))
            | (Q(sender=reciever) & Q(reciever=self.request.user)),
            status="accepted",
        ).exists()
        if existing_friendship:
            return error_response(
                error_codes.FRIENDSHIP_EXISTS,
                "Friendship allready created and accepted",
                status.HTTP_400_BAD_REQUEST,
            )

        serializer = FriendshipCreateSerializer(
            data={**request.data},
            context={"reciever": reciever, "sender": request.user},
        )
        serializer.is_valid(raise_exception=True)
        element = serializer.save()
        serializer = FriendshipRetrieveSerializer(element)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["POST"], url_path="accept-request")
    def accept_request(self, request, pk):
        try:
            existing_request = Friendship.objects.get(
                pk=pk, reciever=request.user, status="pending"
            )
        except Friendship.DoesNotExist:
            return error_response(
                error_codes.FRIEND_REQUEST_GONE,
                "The friendship request could not be found. It may have already been accepted, rejected, or you may not have permission to respond to it.",
                status.HTTP_400_BAD_REQUEST,
            )

        existing_friendship = self.queryset.filter(
            (Q(sender=self.request.user) & Q(reciever=existing_request.sender))
            | (Q(sender=existing_request.sender) & Q(reciever=self.request.user)),
            status="accepted",
        ).exists()
        if existing_friendship:
            existing_request.status = "rejected"
            existing_request.save()
            return error_response(
                error_codes.FRIENDSHIP_EXISTS,
                "You are already friends with this user. The friendship request is not valid anymore has been rejected.",
                status.HTTP_400_BAD_REQUEST,
            )

        existing_request.status = "accepted"
        existing_request.save()

        serializer = FriendshipRetrieveSerializer(existing_request)

        return Response(serializer.data)

    @action(detail=True, methods=["POST"], url_path="reject-request")
    def reject_request(self, request, pk=None):
        try:
            existing_request = Friendship.objects.get(
                pk=pk, reciever=request.user, status="pending"
            )
        except Friendship.DoesNotExist:
            return error_response(
                error_codes.FRIEND_REQUEST_GONE,
                "The friendship request could not be found. It may have already been accepted, rejected, or you may not have permission to respond to it.",
                status.HTTP_400_BAD_REQUEST,
            )

        existing_friendship = self.queryset.filter(
            (Q(sender=self.request.user) & Q(reciever=existing_request.sender))
            | (Q(sender=existing_request.sender) & Q(reciever=self.request.user)),
            status="accepted",
        ).exists()
        if existing_friendship:
            existing_request.status = "rejected"
            existing_request.save()
            return error_response(
                error_codes.FRIENDSHIP_EXISTS,
                "You are already friends with this user. The friendship request is not valid anymore has been rejected.",
                status.HTTP_400_BAD_REQUEST,
            )

        existing_request.status = "rejected"
        existing_request.save()

        serializer = FriendshipRetrieveSerializer(existing_request)

        return Response(serializer.data)
