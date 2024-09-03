import React from 'react';
import { Link } from 'react-router-dom';
import FlickeringGrid from './../components/magicui/FlickeringGrid';
import DataSelector from './../components/DataSelector'; // Asegúrate de ajustar la ruta si es necesario

const AdminDashboard: React.FC = () => (
  <div className="position-relative" style={{ minHeight: '100vh' }}>
    {/* Fondo interactivo (Flickering Grid) */}
    <FlickeringGrid />

    <div className="container position-relative" style={{ zIndex: 1 }}>
      <h2 className="display-3 mb-4 text-center">Admin Dashboard</h2>
      <p className="mb-4 text-center">¡Bienvenido al panel de administración! Aquí puedes gestionar los usuarios de la plataforma.</p>

      <div className="row mb-4">
        {/* Aquí incorporamos el DataSelector como una herramienta adicional */}
        <div className="col-md-12">
          <div className="card">
            <div className="card-body text-center">
              <h5 className="card-title">Seleccionar Datos</h5>
              <p className="card-text">Utiliza el selector de datos para filtrar o gestionar datos específicos.</p>
              <DataSelector />
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <div className="card">
            <div className="card-body text-center">
              <h5 className="card-title">Listar Usuarios</h5>
              <p className="card-text">Ver todos los usuarios registrados.</p>
              <Link to="/admin/users/list" className="btn btn-primary">Ver Usuarios</Link>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-3">
          <div className="card">
            <div className="card-body text-center">
              <h5 className="card-title">Crear Usuario</h5>
              <p className="card-text">Añadir un nuevo usuario a la plataforma.</p>
              <Link to="/admin/users/create" className="btn btn-success">Crear Usuario</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default AdminDashboard;
