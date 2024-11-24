import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  Box,
} from '@mui/material';

interface Organization {
  id: string;
  name: string;
}

const DatasetCard: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingOrgs, setFetchingOrgs] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setFetchingOrgs(true);
    setError(null);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://api/github/organizations', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener las organizaciones.');
      }

      const data = await response.json();
      setOrganizations(data);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setError('Hubo un problema al obtener las organizaciones. Por favor, inténtalo de nuevo.');
    } finally {
      setFetchingOrgs(false);
    }
  };

  const fetchDataset = async () => {
    if (!selectedOrg) {
      setError('Debe seleccionar una organización.');
      return;
    }

    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://api/adminml/generateSim-dataset/${selectedOrg}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor.');
      }

      const result = await response.json();
      setData(result);
      setSuccessMessage('Dataset generado con éxito.');
    } catch (error) {
      console.error('Error fetching dataset:', error);
      setError('Hubo un problema al generar el dataset. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Generar Dataset para Entrenamiento
        </Typography>

        {fetchingOrgs ? (
          <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="body1" gutterBottom>
              Selecciona una Organización
            </Typography>

            <Select
              value={selectedOrg}
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

            <Button
              variant="contained"
              color="primary"
              onClick={fetchDataset}
              disabled={loading || !selectedOrg}
              startIcon={loading ? <CircularProgress size={24} /> : null}
              sx={{ mt: 2 }}
            >
              {loading ? 'Generando...' : 'Generar Dataset'}
            </Button>
          </>
        )}

        {error && (
          <Snackbar open autoHideDuration={6000} onClose={() => setError(null)}>
            <Alert onClose={() => setError(null)} severity="error">
              {error}
            </Alert>
          </Snackbar>
        )}

        {successMessage && (
          <Snackbar open autoHideDuration={6000} onClose={() => setSuccessMessage(null)}>
            <Alert onClose={() => setSuccessMessage(null)} severity="success">
              {successMessage}
            </Alert>
          </Snackbar>
        )}

        {data.length > 0 ? (
          <TableContainer component={Paper} sx={{ mt: 3, maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell><strong>User 1</strong></TableCell>
                  <TableCell><strong>User 2</strong></TableCell>
                  <TableCell><strong>Commits Juntos</strong></TableCell>
                  <TableCell><strong>Contributions Juntas</strong></TableCell>
                  <TableCell><strong>Pull Requests Comentados</strong></TableCell>
                  <TableCell><strong>Revisiones</strong></TableCell>
                  <TableCell><strong>Resultado</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.slice(0, 50).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.user_1}</TableCell>
                    <TableCell>{row.user_2}</TableCell>
                    <TableCell>{row.commits_juntos}</TableCell>
                    <TableCell>{row.contributions_juntas}</TableCell>
                    <TableCell>{row.pull_requests_comentados}</TableCell>
                    <TableCell>{row.revisiones}</TableCell>
                    <TableCell>{row.resultado}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          !loading && (
            <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
              No hay datos disponibles para mostrar.
            </Typography>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default DatasetCard;
