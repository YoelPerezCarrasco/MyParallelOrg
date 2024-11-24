import React, { useState, useEffect } from 'react';
import { Card, Typography, TextField, Button, Select, MenuItem, Box, Snackbar, Alert } from '@mui/material';
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
  const [loading, setLoading] = useState<boolean>(false);
  const [showLoadingModal, setShowLoadingModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = () => {
    setLoading(true);
    fetch('http://api/github/organizations')
      .then((response) => response.json())
      .then((data) => {
        setOrganizations(data);
      })
      .catch((error) => setError('Error al obtener las organizaciones.'))
      .finally(() => setLoading(false));
  };

  const handleAddOrganization = () => {
    if (!newOrg.trim()) {
      setError('El nombre de la organización no puede estar vacío.');
      return;
    }

    setLoading(true);
    fetch(`http://api/github/org-users2/${newOrg}`, { method: 'GET' })
      .then((response) => {
        if (response.ok) {
          return fetch('http://api/github/organizations');
        } else {
          throw new Error('Error al agregar la organización');
        }
      })
      .then((response) => response.json())
      .then((data) => {
        setOrganizations(data);
        setSelectedOrg(newOrg);
        setNewOrg('');
        setSuccess(true);
      })
      .catch(() => setError('Error al añadir la organización.'))
      .finally(() => setLoading(false));
  };

  const handleViewGraph = () => {
    if (selectedOrg) {
      navigate(`/admin/graphs/${selectedOrg}`);
    }
  };

  return (
    <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" gutterBottom>
        Gestionar Organizaciones
      </Typography>
      <Typography variant="body1" gutterBottom>
        Selecciona o Añade una Organización
      </Typography>

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

      <Button
        variant="contained"
        color="primary"
        onClick={handleViewGraph}
        disabled={!selectedOrg || loading}
        sx={{ mt: 2 }}
      >
        Ver Gráfico de la Organización
      </Button>

      <TextField
        label="Nombre de la nueva organización"
        value={newOrg}
        onChange={(e) => setNewOrg(e.target.value)}
        fullWidth
        margin="normal"
      />

      <Button
        variant="outlined"
        color="secondary"
        onClick={handleAddOrganization}
        disabled={loading}
      >
        Añadir Organización
      </Button>

      <LoadingModal open={showLoadingModal} />

      {/* Notificaciones de éxito y error */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
      <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
        <Alert onClose={() => setSuccess(false)} severity="success">
          Organización añadida con éxito.
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default OrganizationManagementCard;
