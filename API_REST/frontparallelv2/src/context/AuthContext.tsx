import { createContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { parseJwt } from "../utils/jwtDecode";
import { Email } from "@mui/icons-material";

const swal = require('sweetalert2');

interface AuthContextType {
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  authTokens: any;
  setAuthTokens: React.Dispatch<React.SetStateAction<any>>;
  registerUser: (
    rol: string,
    email: string,  // Añadir el parámetro email
    username: string,
    password: string,
    companyName: string
  ) => Promise<void>;
  loginUser: (username: string, password: string) => Promise<void>;
  logoutUser: () => void;
  isAuthenticated: boolean;  // Agregado aquí
  getUserRole: (authTokens: any) => { role: string | null, username: string | null };  // Agregado aquí
  

}

interface AuthTokensType {
  access_token: string;
  is_admin: boolean;
  is_manager: boolean;
  username: string;
}

interface DecodedToken {
  username: string;
  is_admin: boolean;
  is_manager: boolean;
  exp: number;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export default AuthContext;

interface AuthProviderProps {
  children: ReactNode;
}


export const getUserRole = (authTokens: AuthTokensType | null) => {
  if (!authTokens) return { role: null, username: null };

  const decoded = parseJwt(authTokens.access_token) as DecodedToken | null;
  if (!decoded) {
    return { role: null, username: null };
  }
  let role: string;

  if (decoded.is_admin) {
    role = 'admin';
  } else if (decoded.is_manager) {
    role = 'manager';
  } else {
    role = 'worker';
  }

  return {
    role,
    username: decoded.username,
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(() =>
    localStorage.getItem("authTokens")
      ? JSON.parse(localStorage.getItem("authTokens")!)
      : null
  );

  const [user, setUser] = useState(() => {
    const tokenString = localStorage.getItem("authTokens");
    if (tokenString) {
      try {
        const tokenData = JSON.parse(tokenString);
        return tokenData.username || null;
      } catch (error) {
        console.error("Failed to parse auth tokens:", error);
        return null;
      }
    }
    return null;
  });
  


  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const loginUser = async (username: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password }),
    });
  
    if (response.status === 200) {
      const data = await response.json();
      console.log("Logged In", data);
  
      setAuthTokens(data);
      setUser(data.user);
      localStorage.setItem("authTokens", JSON.stringify(data));
      localStorage.setItem('token', data.access_token);
  
      // Navegación basada en el rol
      if (data.is_admin) {
        navigate("/admin/dashboard");
      } else if (data.is_manager) {
        navigate("/manager/dashboard");
      } else {
        navigate("/user/dashboard");
      }
  
      swal.fire({
        title: "Inicio de sesión exitoso",
        icon: "success",
        toast: true,
        timer: 6000,
        position: 'top-right',
        timerProgressBar: true,
        showConfirmButton: false,
      });
    } else if (response.status === 403) {
      // Manejar cuenta no verificada
      swal.fire({
        title: "Cuenta no verificada. Por favor, revisa tu correo electrónico.",
        icon: "warning",
        toast: true,
        timer: 6000,
        position: 'top-right',
        timerProgressBar: true,
        showConfirmButton: false,
      });
    } else {
      // Manejar otros errores
      swal.fire({
        title: "Usuario o contraseña incorrectos",
        icon: "error",
        toast: true,
        timer: 6000,
        position: 'top-right',
        timerProgressBar: true,
        showConfirmButton: false,
      });
    }
  };
  

  const registerUser = async (
    rol: string,
    email: string,  // Cambiar el tipo a string
    username: string,
    password: string,
    company: string
  ) => {
    console.log("Datos enviados:", {
      rol: rol,
      email: email,  // Usar la variable email correcta
      username: username,
      password: password,
      company: company,
    });
  
    const response = await fetch("/api//auth/register/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rol: rol,
        email: email,  // Incluir email en el cuerpo de la solicitud
        username: username,
        password: password,
        company: company,
      }),
    });

    console.log("Estado de la respuesta:", response.status);

    if (response.status === 201) {
      console.log("Usuario registrado con éxito");
      navigate("/login");
      swal.fire({
        title: "Registro exitoso, Ya puedes iniciar sesión",
        icon: "success",
        toast: true,
        timer: 6000,
        position: 'top-right',
        timerProgressBar: true,
        showConfirmButton: false,
      });
    } else {
      console.log("Error en el servidor. Estado de la respuesta:", response.status);
      const errorData = await response.json();
      console.log("Detalles del error:", errorData);
      swal.fire({
        title: "An Error Occurred " + response.status,
        icon: "error",
        toast: true,
        timer: 6000,
        position: 'top-right',
        timerProgressBar: true,
        showConfirmButton: false,
      });
    }
};



const logoutUser = () => {
  setAuthTokens(null);
  setUser(null);
  localStorage.removeItem("authTokens");
  localStorage.removeItem("token");
  navigate("/login");
  swal.fire({
    title: "Has cerrado sesión",
    icon: "success",
    toast: true,
    timer: 6000,
    position: 'top-right',
    timerProgressBar: true,
    showConfirmButton: false,
  });
};

const contextData = {
  user,
  setUser,
  authTokens,
  setAuthTokens,
  registerUser,
  loginUser,
  logoutUser,
  isAuthenticated: !!authTokens, // Nuevo indicador de autenticación
  getUserRole,

};

useEffect(() => {
  if (authTokens) {
    setUser(authTokens.user);
  }
  setLoading(false);
}, [authTokens, loading]);

return (
  <AuthContext.Provider value={contextData}>
    {loading ? null : children}
  </AuthContext.Provider>
);
};
