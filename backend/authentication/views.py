from djoser.views import UserViewSet as BaseUserViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, serializers
from drf_spectacular.utils import extend_schema
from django.contrib.auth import authenticate
from appEmail.djoserEmailConfig import DjoserUserDeletedEmail


class PasswordSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)
    anonymize = serializers.BooleanField(write_only=True, required=False, default=True)


class CustomUserViewSet(BaseUserViewSet):
    @action(methods=["get", "patch", "put", "delete"], detail=False)
    @extend_schema(
        request=PasswordSerializer, responses={200: None, 204: None, 400: None}
    )
    def me(self, request, *args, **kwargs):
        if request.method == "DELETE":
            serializer = PasswordSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            password = serializer.validated_data["password"]
            anonymize = serializer.validated_data.get("anonymize", True)

            user = authenticate(username=request.user.email, password=password)

            if user is not None:
                request.user.delete(anonymize=anonymize)

                context = {"user": user}
                to = [user.email]
                DjoserUserDeletedEmail(self.request, context).send(to)

                return Response(status=status.HTTP_204_NO_CONTENT)
            else:
                return Response(
                    {"detail": "Incorrect password."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return super().me(request, *args, **kwargs)

    @extend_schema(exclude=True)
    def destroy(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)
