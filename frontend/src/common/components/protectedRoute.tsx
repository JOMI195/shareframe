import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/store";
import { getAuthenticationUrl, getSignInUrl } from "@/assets/endpoints/app/authEndpoints";
import { getUser } from "@/store/entities/authentication/authentication.slice";

interface ProtectedRouteProps {
  redirectPath?: string;
  children?: any;
}

const ProtectedRoute = ({
  redirectPath = getAuthenticationUrl() + getSignInUrl(),
  children,
}: ProtectedRouteProps) => {
  const loggedIn = useAppSelector(getUser).loggedIn;

  if (!loggedIn) {
    return <Navigate to={redirectPath} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
