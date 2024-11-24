import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button, MenuItem, Select, Snackbar, Alert } from '@mui/material';
import LoadingModal from './LoadingModal'; // Asegúrate de tener un componente de carga si es necesario
import { useNavigate } from 'react-router-dom';

interface Organization {
  id: string;
  name: string;
}

const GroupManagementCard: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showLoadingModal, setShowLoadingModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = () => {
    setLoading(true);
    fetch('/api//github/organizations')
      .then((response) => response.json())
      .then((data) => setOrganizations(data))
      .catch((error) => setError('Error al obtener las organizaciones.'))
      .finally(() => setLoading(false));
  };

  const handleGenerateGroups = () => {
    if (!selectedOrg) {
      setError('Debe seleccionar una organización.');
      return;
    }

    setLoading(true);
    setShowLoadingModal(true);
    fetch(`/api//workgroups/manager/groups/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ org: selectedOrg }),  // Asegúrate de enviar el nombre de la organización
    })
      .then((response) => {
        if (response.ok) {
          setSuccess(true);
        } else {
          throw new Error('Error al generar los grupos.');
        }
      })
      .catch((error) => setError(error.message))
      .finally(() => {
        setLoading(false);
        setShowLoadingModal(false);
      });
  };

  return (
    <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" gutterBottom>
        Gestionar Grupos
      </Typography>
      <Typography variant="body1" gutterBottom>
        Selecciona una Organización
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
          <MenuItem key={org.id} value={org.name}>
            {org.name}
          </MenuItem>
        ))}
      </Select>

      <Button
        variant="contained"
        color="primary"
        onClick={handleGenerateGroups}
        disabled={!selectedOrg || loading}
        sx={{ mt: 2 }}
      >
        Generar Grupos
      </Button>

      <LoadingModal open={showLoadingModal} />

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
      <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
        <Alert onClose={() => setSuccess(false)} severity="success">
          Grupos generados con éxito.
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default GroupManagementCard;
