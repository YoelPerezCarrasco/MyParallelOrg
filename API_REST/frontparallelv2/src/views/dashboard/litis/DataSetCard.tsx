import React, { useState } from 'react';
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
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';

const DatasetCard: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [orgName, setOrgName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDataset = async () => {
    if (!orgName.trim()) {
      setError('El nombre de la organización no puede estar vacío.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8000/adminml/generateSim-dataset/${orgName}`);
      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor.");
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching dataset:", error);
      setError("Hubo un problema al generar el dataset. Por favor, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Generar Dataset para Entrenamiento
        </Typography>

        <TextField
          label="Nombre de la Organización"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          fullWidth
          margin="normal"
          error={!orgName.trim()}
          helperText={!orgName.trim() ? "Este campo es obligatorio" : ""}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={fetchDataset}
          disabled={loading || !orgName.trim()}
          startIcon={loading ? <CircularProgress size={24} /> : null}
        >
          {loading ? "Generando..." : "Generar Dataset"}
        </Button>

        {error && (
          <Snackbar open autoHideDuration={6000} onClose={() => setError(null)}>
            <Alert onClose={() => setError(null)} severity="error">
              {error}
            </Alert>
          </Snackbar>
        )}

        {data.length > 0 ? (
          <TableContainer component={Paper} style={{ marginTop: '20px', maxHeight: '400px' }}>
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
            <Typography variant="body2" color="textSecondary" align="center" style={{ marginTop: '20px' }}>
              No hay datos disponibles para mostrar.
            </Typography>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default DatasetCard;
