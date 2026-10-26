import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { confirmEmailChange } from "@/store/entities/authentication/authentication.actions";
import {
  getAuthenticationUrl,
  getSignInUrl,
} from "@/assets/endpoints/app/authEndpoints";
import { useAppDispatch } from "@/store";

const EmailChangeConfirmation = () => {
  const { token } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(getAuthenticationUrl() + getSignInUrl(), { replace: true });
    dispatch(confirmEmailChange(token as string));
  }, [dispatch, navigate, token]);

  return null;
};

export default EmailChangeConfirmation;
