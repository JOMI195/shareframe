from rest_framework import serializers, viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from django.db.models import Q
from .models import User


class UserSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.filter(
        is_active=True,
        is_deleted=False,
        is_superuser=False,
        account__friendship_user_searchable=True,
    ).exclude(username__iexact="admin")

    serializer_class = UserSearchSerializer
    permission_classes = [IsAuthenticated]

    @extend_schema(exclude=True)
    def list(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @extend_schema(exclude=True)
    def retrieve(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=False, methods=["GET"])
    def search(self, request):
        query = request.query_params.get("q", "")

        if len(query) < 2:
            return Response([])

        users = self.get_queryset().filter(Q(username__icontains=query))[:10]

        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)
