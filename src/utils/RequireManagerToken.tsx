import React from "react";
import { useLocation, Navigate } from "react-router-dom";
import { fetchToken } from "../Auth";

interface DecodedToken {
  is_manager: boolean;
  exp: number;
}

export const RequireManagerToken: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const location = useLocation();
  const token = fetchToken();

  if (!token) {
    return <Navigate to="/" state={{ from: location }} />;
  }

  try {
    const decodedToken = decodeToken(token);

    if (decodedToken && decodedToken.is_manager) {
      return children;
    } else {
      return <Navigate to="/unauthorized" state={{ from: location }} />;
    }
  } catch (error) {
    console.error("Error decoding token:", error);
    return <Navigate to="/" state={{ from: location }} />;
  }
};

// Función para decodificar el token JWT
function decodeToken(token: string): DecodedToken | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload) as DecodedToken;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
}
