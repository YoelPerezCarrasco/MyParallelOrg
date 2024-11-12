import React, { useState, useEffect } from 'react';
import { Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Avatar, CircularProgress, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface ConnectedUser {
  id: number;
  username: string;
  avatar_url: string;
  github_url: string;
  probabilidad: number;
}

const AffinityTable: React.FC = () => {
  const [connections, setConnections] = useState<ConnectedUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchRecommendations = async (username: string, token: string) => {
    try {
      const response = await fetch(`http://localhost:8000/prediction/users/${username}/recommendations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        if (Array.isArray(data)) {
          setConnections(data);
        } else {
          setMessage(data.message);
        }
      } else {
        setMessage('No se pudieron obtener las recomendaciones');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setMessage('Ocurrió un error al obtener las recomendaciones');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await fetch('http://localhost:8000/auth/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok && data.username) {
          fetchRecommendations(data.username, token);
        } else {
          setMessage('Error obteniendo el usuario.');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setMessage('Ocurrió un error al obtener el usuario');
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  return (
    <Paper elevation={3} sx={{ padding: 3, width: '100%', mx: 'auto', overflowX: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Tabla de Afinidad con Empleados
      </Typography>
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <CircularProgress />
        </Box>
      ) : message ? (
        <Typography color="error">{message}</Typography>
      ) : connections.length > 0 ? (
        <TableContainer sx={{ maxHeight: 800, overflowY: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Empleado</TableCell>
                <TableCell>Probabilidad de Colaboración</TableCell>
                <TableCell>Perfil de GitHub</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {connections.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar src={user.avatar_url} alt={user.username} sx={{ mr: 2 }} />
                      {user.username}
                    </Box>
                  </TableCell>
                  <TableCell>{(user.probabilidad * 100).toFixed(2)}%</TableCell>
                  <TableCell>
                    <a href={user.github_url} target="_blank" rel="noopener noreferrer">
                      Ver Perfil
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography>No se encontraron recomendaciones.</Typography>
      )}
    </Paper>
  );
};

export default AffinityTable;
