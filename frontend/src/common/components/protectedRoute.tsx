import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import DataNotFound from "./dataNotFound";
import SeasonalSpinner from "./seasonal/seasonalSpinner";
import { Navigate, Outlet, useLocation } from "react-router";
import { getAuthenticationUrl, getSignInUrl } from "@/assets/endpoints/app/authEndpoints";
import { useAppDispatch, useAppSelector } from "@/store";
import { getMyUserDetails } from "@/store/entities/authentication/authentication.slice";
import { loadMyUserProfileShared } from "@/store/entities/authentication/authentication.actions";

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
  const [attempts, setAttempts] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const requested = useRef(-1);
  const loggedIn = localStorage.getItem("loggedIn") === "true";

  // A second try settles an expired session through the usual logout, so the app never renders without a profile.
  useEffect(() => {
    if (!loggedIn || me.id !== 0 || requested.current === retryKey) return;
    requested.current = retryKey;

    (async () => {
      await dispatch(loadMyUserProfileShared());
      setAttempts((n) => n + 1);
      if (retryKey === 0) setRetryKey(1);
    })();
  }, [loggedIn, me.id, retryKey, dispatch]);

  if (!loggedIn) {
    // Router state, not a query parameter, so the return path cannot be planted in a link.
    return <Navigate to={redirectPath} replace state={{ from: location.pathname + location.search }} />;
  }

  if (me.id === 0 && attempts < 2) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", width: "100%", py: 8 }}>
        <SeasonalSpinner />
      </Box>
    );
  }

  if (me.id === 0) {
    return (
      <Box sx={{ width: "100%", py: 8 }}>
        <DataNotFound
          notFoundMessage="Dein Konto konnte nicht geladen werden"
          action={{
            label: "Erneut versuchen",
            onClick: () => {
              setAttempts(1);
              setRetryKey((key) => key + 1);
            },
          }}
        />
      </Box>
    );
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
