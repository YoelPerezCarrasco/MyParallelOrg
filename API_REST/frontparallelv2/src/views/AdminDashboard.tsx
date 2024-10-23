import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface Organization {
  id: string;
  name: string;
}

interface GamificationConfig {
  puntos_commit: number;
  puntos_revision: number;
  puntos_pr_aceptado: number;
}

const AdminDashboard: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [newOrg, setNewOrg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [modelStatus, setModelStatus] = useState<{ status: string; accuracy: string | null }>({ status: '', accuracy: null });
  const [config, setConfig] = useState<GamificationConfig>({ puntos_commit: 10, puntos_revision: 5, puntos_pr_aceptado: 20 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrganizations();
    const token = localStorage.getItem('token');

    // Obtener el estado del modelo
    fetch('http://localhost:8000/adminml/admin/model-status', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => setModelStatus(data));

    // Obtener la configuración de gamificación
    fetch('http://localhost:8000/admin/admin/gamification-config', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => setConfig(data));
  }, []);

  const fetchOrganizations = () => {
    setLoading(true);
    fetch('http://localhost:8000/github/organizations')
      .then(response => response.json())
      .then(data => {
        setOrganizations(data);
      })
      .catch(error => console.error('Error fetching organizations:', error))
      .finally(() => setLoading(false));
  };

  const handleAddOrganization = () => {
    if (newOrg) {
      setLoading(true);
      fetch(`http://localhost:8000/github/org-users2/${newOrg}`, {
        method: 'GET',
      })
        .then(response => {
          if (response.ok) {
            // Refrescar la lista de organizaciones
            return fetch('http://localhost:8000/github/organizations');
          } else {
            throw new Error('Error al agregar la organización');
          }
        })
        .then(response => response.json())
        .then(data => {
          setOrganizations(data);
          setSelectedOrg(newOrg);
          setNewOrg('');
        })
        .catch(error => console.error('Error:', error))
        .finally(() => setLoading(false));
    }
  };

  const handleViewGraph = () => {
    if (selectedOrg) {
      navigate(`/graphs/${selectedOrg}`);
    }
  };

  const trainModel = () => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:8000/adminml/admin/train-model', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => alert(data.message))
      .catch(err => console.error(err));
  };

  const updateConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    fetch('http://localhost:8000/admin/admin/gamification-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(config),
    })
      .then(res => res.json())
      .then(data => alert(data.message))
      .catch(err => console.error(err));
  };

  const updatePoints = () => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:8000/admin/admin/update-points', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => alert(data.message))
      .catch(err => console.error(err));
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">Panel de Administración</h2>

      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          Estado del Modelo de Machine Learning
        </div>
        <div className="card-body">
          <p><strong>Estado:</strong> {modelStatus.status}</p>
          {modelStatus.accuracy && <p><strong>Precisión:</strong> {modelStatus.accuracy}</p>}
          <button className="btn btn-primary me-2" onClick={trainModel}>Entrenar Modelo</button>
          <button className="btn btn-secondary" onClick={updatePoints}>Actualizar Puntos de Usuarios</button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header bg-success text-white">
          Configuración de Gamificación
        </div>
        <div className="card-body">
          <form onSubmit={updateConfig}>
            <div className="form-group mb-3">
              <label htmlFor="puntos_commit">Puntos por Commit</label>
              <input
                type="number"
                className="form-control"
                id="puntos_commit"
                value={config.puntos_commit}
                onChange={e => setConfig({ ...config, puntos_commit: parseInt(e.target.value) })}
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="puntos_revision">Puntos por Revisión</label>
              <input
                type="number"
                className="form-control"
                id="puntos_revision"
                value={config.puntos_revision}
                onChange={e => setConfig({ ...config, puntos_revision: parseInt(e.target.value) })}
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="puntos_pr_aceptado">Puntos por Pull Request Aceptado</label>
              <input
                type="number"
                className="form-control"
                id="puntos_pr_aceptado"
                value={config.puntos_pr_aceptado}
                onChange={e => setConfig({ ...config, puntos_pr_aceptado: parseInt(e.target.value) })}
              />
            </div>
            <button type="submit" className="btn btn-success">Actualizar Configuración</button>
          </form>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header bg-info text-white">
          Gestión de Usuarios
        </div>
        <div className="card-body text-center">
          <p>Gestiona los usuarios registrados en la plataforma.</p>
          <Link to="/admin/users/list" className="btn btn-primary me-2">Ver Usuarios</Link>
          <Link to="/admin/users/create" className="btn btn-success">Crear Usuario</Link>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header bg-warning text-dark">
          Gestionar Organizaciones
        </div>
        <div className="card-body">
          <h5 className="card-title">Selecciona o Añade una Organización</h5>
          <div className="mb-3">
            <label htmlFor="organizationSelect" className="form-label">Organización</label>
            <select
              id="organizationSelect"
              className="form-select"
              value={selectedOrg || ''}
              onChange={e => setSelectedOrg(e.target.value)}
              disabled={loading}
            >
              <option value="" disabled>Selecciona una organización</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
          <div className="d-grid mb-3">
            <button
              className="btn btn-primary"
              onClick={handleViewGraph}
              disabled={!selectedOrg || loading}
            >
              Ver Gráfico de la Organización
            </button>
          </div>

          <hr />

          <h5 className="card-title">Añadir Nueva Organización</h5>
          <div className="mb-3">
            <label htmlFor="newOrgInput" className="form-label">Nombre de la nueva organización</label>
            <input
              type="text"
              id="newOrgInput"
              className="form-control"
              value={newOrg}
              onChange={e => setNewOrg(e.target.value)}
              placeholder="Introduce el nombre"
              disabled={loading}
            />
          </div>
          <div className="d-grid">
            <button
              className="btn btn-success"
              onClick={handleAddOrganization}
              disabled={!newOrg || loading}
            >
              {loading ? 'Cargando...' : 'Añadir Organización'}
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center mt-3">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
