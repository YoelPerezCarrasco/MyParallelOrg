import React, { useState, useEffect } from 'react';
import { Card, Typography, TextField, Button, Select, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LoadingModal from './LoadingModal';

interface Organization {
  id: string;
  name: string;
}

const OrganizationManagementCard: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [newOrg, setNewOrg] = useState<string>('');
  const [showLoadingModal, setShowLoadingModal] = useState<boolean>(false); // Estado para el modal de carga
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = () => {
    setShowLoadingModal(true); // Mostrar el modal de carga
    fetch('http://localhost:8000/github/organizations')
      .then(response => response.json())
      .then(data => {
        setOrganizations(data);
      })
      .catch(error => console.error('Error fetching organizations:', error))
      .finally(() => {
        setShowLoadingModal(false); // Ocultar el modal de carga
      });
  };

  const handleAddOrganization = () => {
    if (newOrg) {
      setShowLoadingModal(true); // Mostrar el modal de carga
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
        .finally(() => {
          setShowLoadingModal(false); // Ocultar el modal de carga
        });
    }
  };

  const handleViewGraph = () => {
    if (selectedOrg) {
      navigate(`/graphs/${selectedOrg}`);
    }
  };

  return (
    <Card>
      <Typography variant="h5">Gestionar Organizaciones</Typography>
      <Typography variant="body1">Selecciona o Añade una Organización</Typography>
      <Select
        value={selectedOrg || ''}
        onChange={(e) => setSelectedOrg(e.target.value)}
        fullWidth
        displayEmpty
      >
        <MenuItem value="" disabled>
          Selecciona una organización
        </MenuItem>
        {organizations.map((org) => (
          <MenuItem key={org.id} value={org.id}>
            {org.name}
          </MenuItem>
        ))}
      </Select>
      <Button variant="contained" color="primary" onClick={handleViewGraph} disabled={!selectedOrg}>
        Ver Gráfico de la Organización
      </Button>
      <TextField
        label="Nombre de la nueva organización"
        value={newOrg}
        onChange={(e) => setNewOrg(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button variant="contained" color="secondary" onClick={handleAddOrganization}>
        Añadir Organización
      </Button>

      {/* Modal de Carga */}
      <LoadingModal open={showLoadingModal} />
    </Card>
  );
};

export default OrganizationManagementCard;
