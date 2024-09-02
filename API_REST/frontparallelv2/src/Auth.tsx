import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';

export const setToken = (token: string): void => {
  localStorage.setItem('token', token); // Usa el token que prefieras
};

export const fetchToken = (): string | null => {
  return localStorage.getItem('token');
};

interface RequireTokenProps {
  children: React.ReactNode;
}

export const RequireToken: React.FC<RequireTokenProps> = ({ children }) => {
  const auth = fetchToken();
  const location = useLocation();

  if (!auth) {
    return <Navigate to="/" state={{ from: location }} />;
  }

  return <>{children}</>;
};
