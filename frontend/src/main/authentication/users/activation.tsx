import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { activateUser } from "@/store/entities/authentication/authentication.actions";
import {
  getAuthenticationUrl,
  getSignInUrl,
} from "@/assets/endpoints/app/authEndpoints";
import { useAppDispatch } from "@/store";

const Activation = () => {
  const { uid, token } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(getAuthenticationUrl() + getSignInUrl(), { replace: true });
    dispatch(activateUser({ uid: uid as string, token: token as string }));
  }, []);

  return null;
};

export default Activation;