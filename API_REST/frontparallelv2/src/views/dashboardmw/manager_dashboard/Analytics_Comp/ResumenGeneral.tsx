// components/ResumenGeneral.tsx
import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import ReactEcharts from 'echarts-for-react';

interface ResumenData {
  totalGrupos: number;
  totalUsuarios: number;
  commitsTotales: number;
  pullRequestsTotales: number;
}

const ResumenGeneral: React.FC = () => {
  const [data, setData] = useState<ResumenData | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/stadistics/api/dashboard/resumen')
      .then(response => response.json())
      .then(data => setData(data))
      .catch(error => console.error('Error fetching resumen data:', error));
  }, []);

  const getSparklineOption = (values: number[]) => ({
    grid: { top: 0, bottom: 0, left: 0, right: 0 },
    xAxis: { type: 'category', show: false },
    yAxis: { type: 'value', show: false },
    series: [
      {
        data: values,
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2, color: '#3b82f6' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: 'rgba(59, 130, 246, 0)' },
            ],
          },
        },
      },
    ],
  });

  return (
    <Grid container spacing={2}>
      {data ? (
        <>
          {/* Total de Grupos */}
          <Grid item xs={12} md={3}>
            <Paper elevation={3} sx={{ padding: 2 }}>
              <Typography variant="h6">Total de Grupos</Typography>
              <Typography variant="h4">{data.totalGrupos}</Typography>
              <ReactEcharts
                option={getSparklineOption([10, 12, 15, 14, 20, 25])} // Datos de ejemplo; reemplaza con los valores reales
                style={{ height: '80px' }}
              />
            </Paper>
          </Grid>

          {/* Total de Usuarios */}
          <Grid item xs={12} md={3}>
            <Paper elevation={3} sx={{ padding: 2 }}>
              <Typography variant="h6">Total de Usuarios</Typography>
              <Typography variant="h4">{data.totalUsuarios}</Typography>
              <ReactEcharts
                option={getSparklineOption([8, 10, 12, 14, 16, 18])}
                style={{ height: '80px' }}
              />
            </Paper>
          </Grid>

          {/* Commits Totales */}
          <Grid item xs={12} md={3}>
            <Paper elevation={3} sx={{ padding: 2 }}>
              <Typography variant="h6">Commits Totales</Typography>
              <Typography variant="h4">{data.commitsTotales}</Typography>
              <ReactEcharts
                option={getSparklineOption([5, 10, 15, 20, 25, 30])}
                style={{ height: '80px' }}
              />
            </Paper>
          </Grid>

          {/* Pull Requests Totales */}
          <Grid item xs={12} md={3}>
            <Paper elevation={3} sx={{ padding: 2 }}>
              <Typography variant="h6">Pull Requests Totales</Typography>
              <Typography variant="h4">{data.pullRequestsTotales}</Typography>
              <ReactEcharts
                option={getSparklineOption([4, 6, 8, 10, 12, 14])}
                style={{ height: '80px' }}
              />
            </Paper>
          </Grid>
        </>
      ) : (
        <Typography>Cargando datos...</Typography>
      )}
    </Grid>
  );
};

export default ResumenGeneral;
