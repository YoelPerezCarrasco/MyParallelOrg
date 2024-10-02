import React, { useContext } from "react";
import AuthContext from "../context/AuthContext";
import { Link } from "react-router-dom";
import { parseJwt } from './../utils/jwtDecode';
import './../styles/Navbar.css'; // Personaliza estilos adicionales si es necesario

const Navbar: React.FC = () => {
  const { logoutUser } = useContext(AuthContext)!;

  let username: string | null = null;
  let is_admin: boolean | null = null;
  let is_manager: boolean | null = null;


  const token = localStorage.getItem("authTokens");

  if (token) {
    const decoded = parseJwt(token);
    if (decoded) {
      username = decoded.username;
      is_admin = decoded.is_admin;
      is_manager = decoded.is_manager;
    }
  }

  let dashboardLink = "/user/dashboard";  // Valor predeterminado para usuarios normales

  if (is_admin) {
    dashboardLink = "/admin/dashboard";  // Redirige a /admin/dashboard si es administrador
  } else if (is_manager) {
    dashboardLink = "/manager/dashboard";  // Redirige a /manager/dashboard si es manager
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm sticky-top">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img
            src={require('./../styles/pngwing.com.png')}
            alt="Brand Logo"
            style={{ width: "40px", height: "40px", marginRight: "10px" }}
          />
          <span className="display-7">MyParallelOrg</span>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" aria-current="page" to="/" style={{ fontFamily: 'Roboto, sans-serif' }}>
                Inicio
              </Link>
            </li>
            {!token ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login" style={{ fontFamily: 'Roboto, sans-serif' }}>
                    Iniciar Sesión
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register" style={{ fontFamily: 'Roboto, sans-serif' }}>
                    Registrarse
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to={dashboardLink} style={{ fontFamily: 'Roboto, sans-serif' }}>
                    Dashboard
                  </Link>
                </li>
                {username && (
                  <li className="nav-item dropdown">
                    <a
                      className="nav-link dropdown-toggle"
                      href="#"
                      id="navbarDropdown"
                      role="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      style={{ fontFamily: 'Roboto, sans-serif' }}
                    >
                      {username} {is_admin && "(Admin)"}
                    </a>
                    <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                      <li>
                        <Link className="dropdown-item" to="/settings">Ajustes</Link>
                      </li>
                      <li>
                        <hr className="dropdown-divider" />
                      </li>
                      <li>
                        <button
                          className="dropdown-item text-danger"
                          onClick={logoutUser}
                          style={{ cursor: "pointer", background: "none", border: "none" }}
                        >
                          Cerrar Sesión
                        </button>
                      </li>
                    </ul>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
