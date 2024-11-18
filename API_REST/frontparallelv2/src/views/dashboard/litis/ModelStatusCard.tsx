import React, { useEffect, useState } from 'react';
import { Card, Typography, Button, CircularProgress, Box, Select, MenuItem, Snackbar, Alert } from '@mui/material';

interface ModelStatus {
  status: string;
  accuracy: string | null;
}

interface Organization {
  id: string;
  name: string;
}

const ModelStatusCard: React.FC = () => {
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = () => {
    setLoading(true);
    fetch('http://localhost:8000/github/organizations')
      .then((response) => response.json())
      .then((data) => setOrganizations(data))
      .catch((error) => setError('Error al obtener las organizaciones.'))
      .finally(() => setLoading(false));
  };

  const trainModel = () => {
    if (!selectedOrg) {
      setError('Debe seleccionar una organización.');
      return;
    }
    const token = localStorage.getItem('token');
    setLoading(true);
    fetch('http://localhost:8000/adminml/admin/train-model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ organization: selectedOrg }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          setSuccessMessage(data.message);
          // Opcionalmente, puedes actualizar el estado del modelo aquí
        } else if (data.detail) {
          setError(data.detail);
        }
      })
      .catch((err) => setError('Error al entrenar el modelo.'))
      .finally(() => setLoading(false));
  };

  return (
    <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" gutterBottom>
        Estado del Modelo de Machine Learning
      </Typography>

      <Typography variant="body1" gutterBottom>
        Selecciona una Organización
      </Typography>

      <Select
        value={selectedOrg || ''}
        onChange={(e) => setSelectedOrg(e.target.value)}
        fullWidth
        displayEmpty
        disabled={loading}
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

      {/* Opcional: Mostrar estado del modelo para la organización seleccionada */}
      {/* Puedes implementar lógica para obtener y mostrar el estado del modelo */}

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={trainModel}
          disabled={loading || !selectedOrg}
        >
          Entrenar Modelo
        </Button>
        <Button variant="outlined" color="secondary" onClick={() => {}} disabled={loading}>
          Actualizar Puntos
        </Button>
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
          <CircularProgress />
        </Box>
      )}

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default ModelStatusCard;
