import React, { useState, useEffect } from 'react';
import { Card, Typography, TextField, Button } from '@mui/material';

interface GamificationConfig {
  puntos_commit: number;
  puntos_revision: number;
  puntos_pr_aceptado: number;
}

const GamificationConfigCard: React.FC = () => {
  const [config, setConfig] = useState<GamificationConfig>({
    puntos_commit: 10,
    puntos_revision: 5,
    puntos_pr_aceptado: 20,
  });

  useEffect(() => {
    // Lógica para obtener la configuración inicial
  }, []);

  const updateConfig = () => {
    // Lógica para actualizar la configuración
  };

  return (
    <Card>
      <Typography variant="h5">Configuración de Gamificación</Typography>
      <form onSubmit={updateConfig}>
        <TextField
          label="Puntos por Commit"
          type="number"
          value={config.puntos_commit}
          onChange={(e) => setConfig({ ...config, puntos_commit: parseInt(e.target.value) })}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Puntos por Revisión"
          type="number"
          value={config.puntos_revision}
          onChange={(e) => setConfig({ ...config, puntos_revision: parseInt(e.target.value) })}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Puntos por Pull Request Aceptado"
          type="number"
          value={config.puntos_pr_aceptado}
          onChange={(e) => setConfig({ ...config, puntos_pr_aceptado: parseInt(e.target.value) })}
          fullWidth
          margin="normal"
        />
        <Button type="submit" variant="contained" color="primary">Actualizar Configuración</Button>
      </form>
    </Card>
  );
};

export default GamificationConfigCard;
