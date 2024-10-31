import { createContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

const swal = require('sweetalert2');

interface AuthContextType {
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  authTokens: any;
  setAuthTokens: React.Dispatch<React.SetStateAction<any>>;
  registerUser: (rol: string, username: string, password: string, companyName: string) => Promise<void>;
  loginUser: (username: string, password: string) => Promise<void>;
  logoutUser: () => void;
  isAuthenticated: boolean;  // Agregado aquí

}

const AuthContext = createContext<AuthContextType | null>(null);

export default AuthContext;

interface AuthProviderProps {
  children: ReactNode;
}

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
    const response = await fetch('http://localhost:8000/auth/login/', {
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
      setUser(data.user); // Asumiendo que la API devuelve detalles del usuario en la respuesta
      localStorage.setItem("authTokens", JSON.stringify(data));
      localStorage.setItem('token', data.access_token);
  
      // Verificar si el usuario es administrador o no
      if (data.is_admin) {
        navigate("/admin/dashboard");
      } else if(data.is_manager){
        navigate("/manager/dashboard");
      } else {
        navigate("/user/dashboard")
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
    } else {
      console.log(response.status);
      console.log("Error de server");
  
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

  const registerUser = async (rol: string, username: string, password: string, company: string) => {
    console.log("Datos enviados:", {
        rol: rol,
        username: username,
        password: password,
        company: company
    });

    const response = await fetch("http://localhost:8000/auth/register/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        rol: rol,
        username: username,
        password: password,
        company: company
      })
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
