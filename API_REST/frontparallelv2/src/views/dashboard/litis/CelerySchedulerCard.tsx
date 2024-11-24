// src/components/litis/CelerySchedulerCard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, TextField, MenuItem, Button, Typography, List, ListItem, ListItemText, Divider } from '@mui/material';

const frequencies = [
  { value: 'hourly', label: 'Cada hora' },
  { value: 'daily', label: 'Diariamente' },
  { value: 'weekly', label: 'Semanalmente' },
];

interface UpdateHistoryItem {
  id: number;
  timestamp: string;
  action: string;
  frequency?: string;
  user?: string;
}

const CelerySchedulerCard: React.FC = () => {
  const [frequency, setFrequency] = useState<string>('daily');
  const [loading, setLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<UpdateHistoryItem[]>([]);

  useEffect(() => {
    // Obtener la frecuencia actual y el historial del backend al cargar el componente
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        };



        // Obtener la frecuencia actual
        const response = await fetch('http://api/adminml/get_celery_schedule', {
          headers,
        });
        if (response.ok) {
          const data = await response.json();
          setFrequency(data.frequency);
        } else {
          console.error('Error al obtener la frecuencia actual');
        }
        // Obtener el historial
        const historyResponse = await fetch('http://api/adminml/update_history', {
          headers,
        });
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setHistory(historyData);
        } else {
          console.error('Error al obtener el historial de actualizaciones');
        }
      } catch (error) {
        console.error('Error en la petición:', error);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      const authTokens = localStorage.getItem('authTokens');
      const org_name = JSON.parse(authTokens || '{}').org_name;
      const response = await fetch('http://api/adminml/update_celery_schedule', {
        method: 'POST',
        headers,
        body: JSON.stringify({ frequency }),
      });
      if (response.ok) {
        alert('Frecuencia actualizada exitosamente');
        // Actualizar el historial después de guardar
        const historyResponse = await fetch('http://api/adminml/update_history', {
          headers,
        });
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setHistory(historyData);
        } else {
          console.error('Error al obtener el historial de actualizaciones');
        }
      } else {
        console.error('Error al actualizar la frecuencia');
      }
    } catch (error) {
      console.error('Error en la petición:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Configuración de Actualizaciones</Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Programa con qué frecuencia se realizarán las actualizaciones
        </Typography>
        <TextField
          select
          label="Frecuencia de Actualización"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          fullWidth
          margin="normal"
        >
          {frequencies.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>

        {/* Historial de Actualizaciones */}
        <Typography variant="h6" style={{ marginTop: '20px' }}>
          Historial de Actualizaciones
        </Typography>
        <List>
          {history.map((item) => (
            <div key={item.id}>
              <ListItem>
                <ListItemText
                  primary={`Acción: ${item.action}`}
                  secondary={`Fecha: ${new Date(item.timestamp).toLocaleString()} - Frecuencia: ${item.frequency} - Usuario: ${item.user}`}
                />
              </ListItem>
              <Divider />
            </div>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default CelerySchedulerCard;
