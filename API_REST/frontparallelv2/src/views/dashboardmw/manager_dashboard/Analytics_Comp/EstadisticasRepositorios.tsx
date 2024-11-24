// components/EstadisticasRepositorios.tsx
import React, { useEffect, useState } from 'react';
import { Paper, Typography, Grid, Box } from '@mui/material';
import ReactEcharts from 'echarts-for-react';

interface RepositorioData {
  lenguajes: { [key: string]: number };
  repositorios: {
    nombre: string;
    estrellas: number;
    lenguaje: string;
  }[];
}

const EstadisticasRepositorios: React.FC = () => {
  const [data, setData] = useState<RepositorioData | null>(null);

  useEffect(() => {
    fetch('/api//stadistics/api/estadisticas/repositorios')
      .then(response => response.json())
      .then(data => setData(data))
      .catch(error => console.error('Error fetching repository data:', error));
  }, []);

  const getOption = () => {
    if (!data) return {};

    const lenguajes = Object.keys(data.lenguajes);
    const cantidades = Object.values(data.lenguajes);

    return {
      tooltip: { trigger: 'item' },
      legend: {
        top: 'bottom',
        textStyle: { color: 'black' },
      },
      series: [
        {
          name: 'Lenguajes',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '40%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 5,
            borderColor: '#fff',
            borderWidth: 1,
          },
          label: { show: false, position: 'center', color: 'black' },
          emphasis: {
            label: {
              show: true,
              fontSize: '16',
              fontWeight: 'bold',
              color: 'black',
            },
          },
          labelLine: { show: false },
          data: lenguajes.map((lenguaje, index) => ({
            value: cantidades[index],
            name: lenguaje,
          })),
        },
      ],
      backgroundColor: 'transparent',
    };
  };

  return (
    <Paper elevation={3} sx={{ padding: 3, backgroundColor: '#f3f4f6' }}>
      <Typography variant="h5" gutterBottom>
        Estadísticas de Repositorios
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Distribución de lenguajes de programación en los proyectos de la organización.
      </Typography>
      
      {data ? (
        <>
          <ReactEcharts option={getOption()} style={{ height: '350px', width: '100%' }} />
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Lista de Proyectos
          </Typography>
          <Grid container spacing={2}>
            {data.repositorios.map((repo, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper elevation={2} sx={{ padding: 2, backgroundColor: '#fff' }}>
                  <Box display="flex" flexDirection="column">
                    <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {repo.nombre}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Lenguaje:</strong> {repo.lenguaje}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Estrellas:</strong> {repo.estrellas}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </>
      ) : (
        <Typography>Cargando datos...</Typography>
      )}
    </Paper>
  );
};

export default EstadisticasRepositorios;
