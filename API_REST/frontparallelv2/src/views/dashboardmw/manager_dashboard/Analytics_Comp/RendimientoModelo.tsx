// components/RendimientoModelo.tsx
import React, { useEffect, useState } from 'react';
import { Paper, Typography, Grid } from '@mui/material';
import ReactEcharts from 'echarts-for-react';

interface ModeloData {
  precision: number;
  recall: number;
  f1Score: number;
  accuracy: number;
  matrizConfusion: number[][];
}

const RendimientoModelo: React.FC = () => {
  const [data, setData] = useState<ModeloData | null>(null);

  useEffect(() => {
    fetch('http://api/stadistics/api/modelo/rendimiento')
      .then(response => response.json())
      .then(data => setData(data))
      .catch(error => console.error('Error fetching model data:', error));
  }, []);

  const getMetricsOption = () => {
    if (!data) return {};

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      xAxis: {
        type: 'category',
        data: ['Precisión', 'Recall', 'F1 Score', 'Accuracy'],
        axisLabel: {
          color: '#ccc',
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 1,
        axisLabel: {
          formatter: '{value}',
          color: '#ccc',
        },
      },
      series: [
        {
          data: [data.precision, data.recall, data.f1Score, data.accuracy],
          type: 'bar',
          itemStyle: {
            color: '#3b82f6',
          },
        },
      ],
      backgroundColor: 'transparent',
    };
  };

  const getConfusionMatrixOption = () => {
    if (!data) return {};

    const matriz = data.matrizConfusion;
    return {
      tooltip: {
        position: 'top',
      },
      xAxis: {
        type: 'category',
        data: ['Pred. Negativo', 'Pred. Positivo'],
        axisLabel: { color: '#ccc' },
      },
      yAxis: {
        type: 'category',
        data: ['Real Positivo', 'Real Negativo'],
        axisLabel: { color: '#ccc' },
      },
      visualMap: {
        min: 0,
        max: Math.max(...matriz.flat()),
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '15%',
        inRange: {
          color: ['#e0f7fa', '#006064'],
        },
        textStyle: { color: '#ccc' },
      },
      series: [
        {
          name: 'Matriz de Confusión',
          type: 'heatmap',
          data: [
            [0, 0, matriz[1][0]], // Real Negativo, Pred. Negativo
            [0, 1, matriz[0][0]], // Real Positivo, Pred. Negativo
            [1, 0, matriz[1][1]], // Real Negativo, Pred. Positivo
            [1, 1, matriz[0][1]], // Real Positivo, Pred. Positivo
          ],
          label: {
            show: true,
            color: '#fff',
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
      backgroundColor: 'transparent',
    };
  };

  return (
    <Paper elevation={3} sx={{ padding: 2 }}>
      <Typography variant="h5">Rendimiento del Modelo</Typography>
      {data ? (
        <>
          <Grid container spacing={2}>
            {/* Gráfico de Métricas */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6">Métricas del Modelo</Typography>
              <ReactEcharts option={getMetricsOption()} style={{ height: '300px' }} />
            </Grid>

            {/* Matriz de Confusión */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6">Matriz de Confusión</Typography>
              <ReactEcharts option={getConfusionMatrixOption()} style={{ height: '300px' }} />
            </Grid>
          </Grid>
        </>
      ) : (
        <Typography>Cargando datos...</Typography>
      )}
    </Paper>
  );
};

export default RendimientoModelo;
