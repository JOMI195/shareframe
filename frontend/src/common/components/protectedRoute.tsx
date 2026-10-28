import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import SeasonalSpinner from "./seasonal/seasonalSpinner";
import { Navigate, Outlet, useLocation } from "react-router";
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
  const location = useLocation();
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
    // Router state, not a query parameter, so the return path cannot be planted in a link.
    return <Navigate to={redirectPath} replace state={{ from: location.pathname + location.search }} />;
  }

  if (me.id === 0 && !attempted) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", width: "100%", py: 8 }}>
        <SeasonalSpinner />
      </Box>
    );
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
