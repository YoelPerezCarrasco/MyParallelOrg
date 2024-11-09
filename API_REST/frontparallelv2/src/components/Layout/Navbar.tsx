// Navbar.tsx
import React, { useContext, useState } from 'react';
import AuthContext from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { parseJwt } from '../../utils/jwtDecode';
import '../../styles/Navbar.css'; // Importa el CSS proporcionado
import 'boxicons/css/boxicons.min.css'; // Importa los estilos de Boxicons

const Navbar: React.FC = () => {
  const { logoutUser } = useContext(AuthContext)!;

  let username: string | null = null;
  let is_admin: boolean | null = null;
  let is_manager: boolean | null = null;

  const token = localStorage.getItem('authTokens');

  if (token) {
    const decoded = parseJwt(token);
    if (decoded) {
      username = decoded.username;
      is_admin = decoded.is_admin;
      is_manager = decoded.is_manager;
    }
  }

  let dashboardLink = '/user/dashboard'; // Valor predeterminado para usuarios normales

  if (is_admin) {
    dashboardLink = '/admin/dashboard';
  } else if (is_manager) {
    dashboardLink = '/manager/dashboard';
  }

  // Estado para manejar la apertura/cierre de la barra lateral
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const menuBtnIconClass = sidebarOpen ? 'bx bx-menu-alt-right' : 'bx bx-menu';

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="logo-details">
        <i className='bx bxl-c-plus-plus icon'></i>
        <div className="logo_name">MyParallelOrg</div>
        <i className={menuBtnIconClass} id="btn" onClick={toggleSidebar}></i>
      </div>
      <ul className="nav-list">
        <li>
          <i className='bx bx-search' onClick={toggleSidebar}></i>
          <input type="text" placeholder="Buscar..." />
          <span className="tooltip">Buscar</span>
        </li>
        <li>
          <Link to="/">
            <i className='bx bx-home'></i>
            <span className="links_name">Inicio</span>
          </Link>
          <span className="tooltip">Inicio</span>
        </li>
        {!token ? (
          <>
            <li>
              <Link to="/login">
                <i className='bx bx-log-in'></i>
                <span className="links_name">Iniciar Sesión</span>
              </Link>
              <span className="tooltip">Iniciar Sesión</span>
            </li>
            <li>
              <Link to="/register">
                <i className='bx bx-user-plus'></i>
                <span className="links_name">Registrarse</span>
              </Link>
              <span className="tooltip">Registrarse</span>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to={dashboardLink}>
                <i className='bx bx-grid-alt'></i>
                <span className="links_name">Dashboard</span>
              </Link>
              <span className="tooltip">Dashboard</span>
            </li>
            {/* Enlaces adicionales para usuarios autenticados */}
            {is_admin && (
              <>
                <li>
                  <Link to="/admin/users/list">
                    <i className='bx bx-user'></i>
                    <span className="links_name">Gestión de Usuarios</span>
                  </Link>
                  <span className="tooltip">Usuarios</span>
                </li>
                {/* Puedes añadir más enlaces específicos para administradores aquí */}
              </>
            )}
            {is_manager && (
              <>
                <li>
                  <Link to="/manager/section">
                    <i className='bx bx-chart'></i>
                    <span className="links_name">Estadísticas Manager</span>
                  </Link>
                  <span className="tooltip">Estadísticas</span>
                </li>
                {/* Puedes añadir más enlaces específicos para managers aquí */}
              </>
            )}
            <li>
              <Link to="/settings">
                <i className='bx bx-cog'></i>
                <span className="links_name">Ajustes</span>
              </Link>
              <span className="tooltip">Ajustes</span>
            </li>
            {/* Perfil y Cerrar Sesión */}
            <li className="profile">
              <div className="profile-details">
                <img src={require('../../styles/pngwing.com.png')} alt="profileImg" />
                <div className="name_job">
                  <div className="name">{username}</div>
                  <div className="job">
                    {is_admin ? 'Administrador' : is_manager ? 'Manager' : 'Usuario'}   
                  </div>
                </div>
              </div>
              <i className='bx bx-log-out' id="log_out" onClick={logoutUser}></i>
            </li>
          </>
        )}
      </ul>
    </div>
  );
};

export default Navbar;
