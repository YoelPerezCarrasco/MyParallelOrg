import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Box,
} from "@mui/material";

interface TaskHistory {
  timestamp: string;
  status: string;
  message: string;
}

const TaskHistoryCard: React.FC<{ taskName: string }> = ({ taskName }) => {
  const [history, setHistory] = useState<TaskHistory[]>([]); // Estado inicial como arreglo vacío
  const [loading, setLoading] = useState<boolean>(true); // Para mostrar un indicador de carga
  const [error, setError] = useState<string | null>(null); // Para manejar errores

  useEffect(() => {
    const fetchTaskHistory = async () => {
      try {
        const response = await fetch(`http://api/adminml/task-history/${taskName}`);
        if (response.ok) {
          const data = await response.json();
          setHistory(data.history || []); // Asegúrate de que data.history sea un arreglo
        } else {
          setError("Error al obtener el historial de tareas.");
        }
      } catch (error) {
        setError("Error en la solicitud al servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchTaskHistory();
  }, [taskName]);

  const clearHistory = async () => {
    try {
      const response = await fetch(`http://api/adminml/clear-task-history/${taskName}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setHistory([]);
        setError(null);
      } else {
        setError("Error al limpiar el historial de tareas.");
      }
    } catch (error) {
      setError("Error en la solicitud al servidor.");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6">Cargando historial...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" color="error">
            {error}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Historial de Tareas: {taskName}</Typography>
          <Button variant="contained" color="secondary" onClick={clearHistory}>
            Limpiar Historial
          </Button>
        </Box>
        {history.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            No hay historial disponible.
          </Typography>
        ) : (
          <List
            sx={{
              maxHeight: "300px", // Altura máxima para el contenedor
              overflowY: "auto", // Scroll vertical
              border: "1px solid #ddd", // Opcional: Añade un borde para delimitar el área
              borderRadius: "4px",
              padding: 1,
            }}
          >
            {history.map((entry, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={`Ejecución: ${new Date(entry.timestamp).toLocaleString()}`}
                  secondary={`${entry.status.toUpperCase()}: ${entry.message}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskHistoryCard;
