import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DataSelector: React.FC = () => {
  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const [newOrg, setNewOrg] = useState<string>('');  // Estado para la nueva organización
  const [loading, setLoading] = useState<boolean>(false);  // Estado para manejar la carga
  const [databases, setDatabases] = useState<{ id: string, name: string }[]>([]);  // Estado para las organizaciones
  const navigate = useNavigate();

  // Obtener las organizaciones desde el backend cuando se monta el componente
  useEffect(() => {
    setLoading(true);
    fetch('http://api/github/organizations')  // Endpoint que devuelve la lista de organizaciones
      .then(response => response.json())
      .then(data => {
        setDatabases(data);  // Asume que la respuesta es un array de objetos con id y name
      })
      .catch(error => console.error('Error fetching organizations:', error))
      .finally(() => setLoading(false));
  }, []);

  const handleSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDb(event.target.value);
  };

  const handleContinue = () => {
    if (selectedDb) {
      navigate(`/graphs/${selectedDb}`);
    }
  };

  const handleAddOrganization = () => {
    if (newOrg) {
      setLoading(true);  // Inicia la carga
      fetch(`http://api/github/org-users2/${newOrg}`, {
        method: 'GET',  // O el método que utilices para crear los usuarios
      })
        .then(response => {
          if (response.ok) {
            // Refrescar la lista de organizaciones
            return fetch('http://api/github/organizations');  // Vuelve a obtener la lista actualizada
          } else {
            throw new Error('Error creating organization');
          }
        })
        .then(response => response.json())
        .then(data => {
          setDatabases(data);  // Actualiza la lista de organizaciones
          setSelectedDb(newOrg);  // Selecciona automáticamente la nueva organización
          setNewOrg('');  // Resetea el campo de entrada
        })
        .catch(error => console.error('Error:', error))
        .finally(() => setLoading(false));  // Termina la carga
    }
  };

  return (
    <div className="container my-5">
      <h1 className="mb-4 text-center">Selecciona La Empresa Con La Que Visualizar</h1>
      <div className="mb-3">
        <label htmlFor="companySelect" className="form-label">Empresa</label>
        <select
          id="companySelect"
          className="form-select form-select-lg"
          value={selectedDb || ''}
          onChange={handleSelection}
          disabled={loading}
        >
          <option value="" disabled>Selecciona una Empresa</option>
          {databases.map(db => (
            <option key={db.id} value={db.id}>{db.name}</option>
          ))}
        </select>
      </div>
      <div className="d-grid mb-4">
        <button
          className="btn btn-primary btn-lg"
          onClick={handleContinue}
          disabled={!selectedDb || loading}
        >
          Continuar
        </button>
      </div>

      <div className="card mt-4">
        <div className="card-body">
          <h2 className="card-title">Añadir Nueva Organización</h2>
          <div className="mb-3">
            <label htmlFor="newOrgInput" className="form-label">Nombre de la nueva organización</label>
            <input
              type="text"
              id="newOrgInput"
              className="form-control"
              value={newOrg}
              onChange={(e) => setNewOrg(e.target.value)}
              placeholder="Introduce el nombre"
              disabled={loading}
            />
          </div>
          <div className="d-grid">
            <button
              className="btn btn-success btn-lg"
              onClick={handleAddOrganization}
              disabled={!newOrg || loading}
            >
              {loading ? 'Cargando...' : 'Añadir Organización'}
            </button>
          </div>
        </div>
      </div>

      {loading && <div className="text-center mt-3"><div className="spinner-border text-primary" role="status"></div></div>}
    </div>
  );
};

export default DataSelector;
