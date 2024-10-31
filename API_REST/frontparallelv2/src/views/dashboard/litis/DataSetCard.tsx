import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField } from '@mui/material';

const DatasetCard: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [orgName, setOrgName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchDataset = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/adminml/generate-dataset/${orgName}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching dataset:", error);
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
        />
        
        <Button variant="contained" color="primary" onClick={fetchDataset} disabled={loading || !orgName}>
          {loading ? "Generando..." : "Generar Dataset"}
        </Button>

        {data.length > 0 && (
          <TableContainer component={Paper} style={{ marginTop: '20px' }}>
            <Table>
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
                {data.map((row, index) => (
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
        )}
      </CardContent>
    </Card>
  );
};

export default DatasetCard;
