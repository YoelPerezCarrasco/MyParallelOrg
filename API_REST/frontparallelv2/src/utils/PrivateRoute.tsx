import { Navigate, useLocation } from "react-router-dom";
import { useContext, ReactNode } from "react";
import AuthContext from "../context/AuthContext";

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user } = useContext(AuthContext)!;
  const location = useLocation();

  if (!user) {
    // If the user is not authenticated, redirect to the login page
    return <Navigate to="/login" state={{ from: location }} />;
  }

  // If the user is authenticated, render the children components
  return <>{children}</>;
};

export default PrivateRoute;
