import React, { useEffect, useState } from 'react';
import { Card, Typography, Button } from '@mui/material';

interface ModelStatus {
  status: string;
  accuracy: string | null;
}

const ModelStatusCard: React.FC = () => {
  const [modelStatus, setModelStatus] = useState<ModelStatus>({ status: '', accuracy: null });

  useEffect(() => {
    // Lógica para obtener el estado del modelo
  }, []);

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

  const updatePoints = () => {
    // Lógica para actualizar puntos
  };

  return (
    <Card>
      <Typography variant="h5">Estado del Modelo de Machine Learning</Typography>
      <Typography variant="body1"><strong>Estado:</strong> {modelStatus.status}</Typography>
      {modelStatus.accuracy && (
        <Typography variant="body1"><strong>Precisión:</strong> {modelStatus.accuracy}</Typography>
      )}
      <Button variant="contained" color="primary" onClick={trainModel}>Entrenar Modelo</Button>
      <Button variant="contained" color="secondary" onClick={updatePoints}>Actualizar Puntos</Button>
    </Card>
  );
};

export default ModelStatusCard;
