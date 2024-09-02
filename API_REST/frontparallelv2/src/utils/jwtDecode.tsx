// src/utils/jwtUtils.ts

export interface DecodedToken {
    username: string;
    is_admin: boolean;
    is_manager: boolean;
  }
  
  export const parseJwt = (token: string): DecodedToken | null => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
  
      return JSON.parse(jsonPayload) as DecodedToken;
    } catch (error) {
      console.error("Failed to parse JWT token", error);
      return null;
    }
  };
  