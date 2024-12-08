from rest_framework.viewsets import GenericViewSet
from rest_framework.decorators import action
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, UpdateModelMixin
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from .models import Account
from .permissions import CurrentUserOrAdmin
from .serializers import AccountRetrieveSerializer, AccountUpdateSerializer


class AccountsViewSet(
    ListModelMixin, RetrieveModelMixin, UpdateModelMixin, GenericViewSet
):
    http_method_names = ["get", "patch", "options", "head"]
    queryset = Account.objects.all()

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if "list" and not user.is_staff:
            queryset = queryset.filter(pk=user.pk)
        return queryset

    def get_serializer_class(self):
        if self.action == "me":
            if self.action == ("put" or "patch"):
                return AccountUpdateSerializer
        return AccountRetrieveSerializer

    def get_permissions(self):
        if self.action == "me":
            self.permission_classes = [CurrentUserOrAdmin]
        elif self.action == "list":
            self.permission_classes = [IsAdminUser]
        elif self.action == "retrieve":
            self.permission_classes = [IsAdminUser]
        elif self.action == "partial_update":
            self.permission_classes = [IsAdminUser]
        return super().get_permissions()

    @action(["get", "patch"], detail=False)
    def me(self, request, *args, **kwargs):
        account = Account.objects.get(user=self.request.user)
        if request.method == "GET":
            serializer = AccountRetrieveSerializer(account)
            return Response(serializer.data)
        elif request.method == "PATCH":
            serializer = AccountUpdateSerializer(
                account, data=request.data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            account = serializer.save()
            serializer = AccountRetrieveSerializer(account)
            return Response(serializer.data, status=status.HTTP_200_OK)
