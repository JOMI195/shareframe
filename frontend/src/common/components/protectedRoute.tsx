import { Navigate, Outlet } from "react-router";
import { getAuthenticationUrl, getSignInUrl } from "@/assets/endpoints/app/authEndpoints";

interface ProtectedRouteProps {
  redirectPath?: string;
  children?: any;
}

const ProtectedRoute = ({
  redirectPath = getAuthenticationUrl() + getSignInUrl(),
  children,
}: ProtectedRouteProps) => {
  const loggedIn = localStorage.getItem("loggedIn") === "true";

  if (!loggedIn) {
    return <Navigate to={redirectPath} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
