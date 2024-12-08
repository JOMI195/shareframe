from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.db.models import Q
from django.db import transaction

from .models import Friendship
from .serializers import (
    FriendshipRetrieveSerializer,
    FriendshipCreateSerializer,
    FriendshipDestroySerializer,
)
from user_core.models import User


class FriendshipViewSet(viewsets.ModelViewSet):
    queryset = Friendship.objects.all()
    http_method_names = ["get", "post", "delete", "head", "options"]
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "list":
            return FriendshipRetrieveSerializer
        if self.action == "retrieve":
            return FriendshipRetrieveSerializer
        elif self.action == "create":
            return FriendshipCreateSerializer
        elif self.action == "destroy":
            return FriendshipDestroySerializer
        return self.serializer_class

    def get_queryset(self):
        return self.queryset.filter(
            Q(sender=self.request.user) | Q(reciever=self.request.user)
        )

    @extend_schema(
        responses={200: FriendshipRetrieveSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        responses={200: FriendshipRetrieveSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        try:
            element = self.get_queryset().get(pk=self.kwargs["pk"])
        except Friendship.DoesNotExist:
            return Response(
                {
                    "detail": "Friendship not found or you don't have permission to view it."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(element)
        return Response(serializer.data)

    @extend_schema(
        request=FriendshipCreateSerializer,
        responses={201: FriendshipRetrieveSerializer},
    )
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        reciever_id = request.data.get("reciever_id")

        existing_requests = Friendship.objects.filter(
            sender=request.user, reciever_id=reciever_id
        )

        existing_pending_request = existing_requests.filter(status="pending").exists()
        if existing_pending_request:
            return Response(
                {"detail": "Friendship request already sent"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            reciever = User.objects.get(
                pk=reciever_id, account__friendship_user_searchable=True
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "Reciever not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if reciever == request.user:
            return Response(
                {"detail": "Friendship request to yourself not possible"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_friendship = self.queryset.filter(
            (Q(sender=self.request.user) & Q(reciever=reciever))
            | (Q(sender=reciever) & Q(reciever=self.request.user)),
            status="accepted",
        ).exists()
        if existing_friendship:
            return Response(
                {"detail": "Friendship allready created and accepted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(
            data={**request.data},
            context={"reciever": reciever, "sender": request.user},
        )
        serializer.is_valid(raise_exception=True)
        element = serializer.save()
        serializer = FriendshipRetrieveSerializer(element)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        request=FriendshipDestroySerializer,
        responses={200: FriendshipRetrieveSerializer},
    )
    def destroy(self, request, *args, **kwargs):
        pk_to_delete = self.kwargs["pk"]
        try:
            element = self.get_queryset().get(pk=self.kwargs["pk"])
        except Friendship.DoesNotExist:
            return Response(
                {
                    "detail": "The friendship request could not be found. It may have already been accepted, rejected, or you may not have permission to respond to it."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = FriendshipRetrieveSerializer(element)
        response_data = serializer.data
        response_data["id"] = pk_to_delete
        element.delete()
        return Response(response_data)

    @extend_schema(
        responses={200: FriendshipRetrieveSerializer},
    )
    @action(detail=True, methods=["POST"])
    def accept_request(self, request, pk):
        try:
            existing_request = Friendship.objects.get(
                pk=pk, reciever=request.user, status="pending"
            )
        except Friendship.DoesNotExist:
            return Response(
                {
                    "detail": "The friendship request could not be found. It may have already been accepted, rejected, or you may not have permission to respond to it."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_friendship = self.queryset.filter(
            (Q(sender=self.request.user) & Q(reciever=existing_request.sender))
            | (Q(sender=existing_request.sender) & Q(reciever=self.request.user)),
            status="accepted",
        ).exists()
        if existing_friendship:
            existing_request.status = "rejected"
            existing_request.save()
            return Response(
                {
                    "detail": "You are already friends with this user. The friendship request is not valid anymore has been rejected."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_request.status = "accepted"
        existing_request.save()

        serializer = FriendshipRetrieveSerializer(existing_request)

        return Response(serializer.data)

    @extend_schema(
        responses={200: FriendshipRetrieveSerializer},
    )
    @action(detail=True, methods=["POST"])
    def reject_request(self, request, pk=None):
        try:
            existing_request = Friendship.objects.get(
                pk=pk, reciever=request.user, status="pending"
            )
        except Friendship.DoesNotExist:
            return Response(
                {
                    "detail": "The friendship request could not be found. It may have already been accepted, rejected, or you may not have permission to respond to it."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_friendship = self.queryset.filter(
            (Q(sender=self.request.user) & Q(reciever=existing_request.sender))
            | (Q(sender=existing_request.sender) & Q(reciever=self.request.user)),
            status="accepted",
        ).exists()
        if existing_friendship:
            existing_request.status = "rejected"
            existing_request.save()
            return Response(
                {
                    "detail": "You are already friends with this user. The friendship request is not valid anymore has been rejected."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_request.status = "rejected"
        existing_request.save()

        serializer = FriendshipRetrieveSerializer(existing_request)

        return Response(serializer.data)
