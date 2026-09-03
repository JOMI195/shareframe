import { useEffect, useRef, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { Navigate, Outlet } from "react-router";
import { getAuthenticationUrl, getSignInUrl } from "@/assets/endpoints/app/authEndpoints";
import { useAppDispatch, useAppSelector } from "@/store";
import { getMyUserDetails } from "@/store/entities/authentication/authentication.slice";
import { loadMyUserProfile } from "@/store/entities/authentication/authentication.actions";

interface ProtectedRouteProps {
  redirectPath?: string;
  children?: React.ReactNode;
}

const ProtectedRoute = ({
  redirectPath = getAuthenticationUrl() + getSignInUrl(),
  children,
}: ProtectedRouteProps) => {
  const dispatch = useAppDispatch();
  const me = useAppSelector(getMyUserDetails);
  const [attempted, setAttempted] = useState(false);
  const requested = useRef(false);
  const loggedIn = localStorage.getItem("loggedIn") === "true";

  useEffect(() => {
    if (!loggedIn || me.id !== 0 || requested.current) return;
    requested.current = true;

    (async () => {
      await dispatch(loadMyUserProfile());
      setAttempted(true);
    })();
  }, [loggedIn, me.id, dispatch]);

  if (!loggedIn) {
    return <Navigate to={redirectPath} replace />;
  }

  if (me.id === 0 && !attempted) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", width: "100%", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
