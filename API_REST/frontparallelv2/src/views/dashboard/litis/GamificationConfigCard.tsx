import React, { useState, useEffect } from 'react';
import { Card, Typography, TextField, Button, CircularProgress, Box, Snackbar, Alert } from '@mui/material';

interface GamificationConfig {
  puntos_commit: number;
  puntos_revision: number;
  puntos_pr_aceptado: number;
}

const GamificationConfigCard: React.FC = () => {
  const [config, setConfig] = useState<GamificationConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Simulación de carga de configuración inicial desde la API
    setTimeout(() => {
      setConfig({ puntos_commit: 10, puntos_revision: 5, puntos_pr_aceptado: 20 });
      setLoading(false);
    }, 1000);
  }, []);

  const handleChange = (field: keyof GamificationConfig, value: string) => {
    if (config) {
      setConfig({
        ...config,
        [field]: Math.max(0, parseInt(value, 10) || 0), // Asegura valores positivos o 0
      });
    }
  };

  const updateConfig = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!config) return;

    setUpdating(true);
    setError(null);

    try {
      // Simulación de actualización de configuración en la API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess(true);
    } catch (err) {
      setError("Hubo un error al actualizar la configuración.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" gutterBottom>
        Configuración de Gamificación
      </Typography>
      <form onSubmit={updateConfig}>
        <TextField
          label="Puntos por Commit"
          type="number"
          value={config?.puntos_commit ?? ''}
          onChange={(e) => handleChange("puntos_commit", e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Puntos por Revisión"
          type="number"
          value={config?.puntos_revision ?? ''}
          onChange={(e) => handleChange("puntos_revision", e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Puntos por Pull Request Aceptado"
          type="number"
          value={config?.puntos_pr_aceptado ?? ''}
          onChange={(e) => handleChange("puntos_pr_aceptado", e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <Box mt={2} display="flex" justifyContent="center">
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={updating || !config}
          >
            {updating ? <CircularProgress size={24} /> : "Actualizar Configuración"}
          </Button>
        </Box>
      </form>

      {success && (
        <Snackbar open autoHideDuration={6000} onClose={() => setSuccess(false)}>
          <Alert onClose={() => setSuccess(false)} severity="success">
            Configuración actualizada con éxito.
          </Alert>
        </Snackbar>
      )}

      {error && (
        <Snackbar open autoHideDuration={6000} onClose={() => setError(null)}>
          <Alert onClose={() => setError(null)} severity="error">
            {error}
          </Alert>
        </Snackbar>
      )}
    </Card>
  );
};

export default GamificationConfigCard;
