import React, { useEffect, useState } from 'react';
import { Card, Typography, Button, CircularProgress, Box } from '@mui/material';

interface ModelStatus {
  status: string;
  accuracy: string | null;
}

const ModelStatusCard: React.FC = () => {
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch('http://localhost:8000/adminml/admin/model-status', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setModelStatus(data))
      .catch((err) => setError("Error al cargar el estado del modelo."))
      .finally(() => setLoading(false));
  }, []);

  const trainModel = () => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:8000/adminml/admin/train-model', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => alert(data.message))
      .catch((err) => console.error(err));
  };

  const updatePoints = () => {
    // Lógica para actualizar puntos
    alert("Función de actualizar puntos aún no implementada.");
  };

  return (
    <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" gutterBottom>
        Estado del Modelo de Machine Learning
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography variant="body1" color="error">
          {error}
        </Typography>
      ) : (
        <>
          <Typography variant="body1">
            <strong>Estado:</strong> {modelStatus?.status}
          </Typography>
          {modelStatus?.accuracy && (
            <Typography variant="body1">
              <strong>Precisión:</strong> {modelStatus.accuracy}
            </Typography>
          )}
        </>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
        <Button variant="contained" color="primary" onClick={trainModel} disabled={loading || !!error}>
          Entrenar Modelo
        </Button>
        <Button variant="outlined" color="secondary" onClick={updatePoints} disabled={loading}>
          Actualizar Puntos
        </Button>
      </Box>
    </Card>
  );
};

export default ModelStatusCard;
