// components/ComparativasGrupos.tsx
import React, { useEffect, useState } from 'react';
import { Paper, Typography } from '@mui/material';
import ReactEcharts from 'echarts-for-react';

interface ComparativaData {
  grupos: string[];
  metricas: number[][];
}

const ComparativasGrupos: React.FC = () => {
  const [data, setData] = useState<ComparativaData | null>(null);

  useEffect(() => {
    fetch('http://api/stadistics/api/estadisticas/comparativas')
      .then(response => response.json())
      .then(data => setData(data))
      .catch(error => console.error('Error fetching comparison data:', error));
  }, []);

  const getOption = () => {
    if (!data) return {};

    // Asumimos que tenemos 3 métricas por grupo para este ejemplo.
    const metricCategories = ['Commits', 'Pull Requests', 'Revisiones'];

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: metricCategories,
        textStyle: { color: '#ccc' }
      },
      xAxis: {
        type: 'category',
        data: data.grupos,
        axisLabel: { color: '#ccc' },
        axisLine: { lineStyle: { color: '#ccc' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#ccc' },
        axisLine: { lineStyle: { color: '#ccc' } },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } }
      },
      series: metricCategories.map((metric, index) => ({
        name: metric,
        type: 'bar',
        stack: 'total',
        data: data.metricas.map(metricas => metricas[index]),
        emphasis: {
          focus: 'series'
        },
        label: {
          show: true,
          position: 'inside'
        }
      })),
      backgroundColor: 'transparent'
    };
  };

  return (
    <Paper elevation={3} sx={{ padding: 2 }}>
      <Typography variant="h5">Comparativas entre Grupos</Typography>
      {data ? (
        <>
          <ReactEcharts option={getOption()} style={{ height: '400px' }} />
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Este gráfico muestra una comparación de métricas (Commits, Pull Requests y Revisiones) entre diferentes grupos de trabajo. Cada barra representa un grupo, y las porciones indican las métricas específicas.
          </Typography>
        </>
      ) : (
        <Typography>Cargando datos...</Typography>
      )}
    </Paper>
  );
};

export default ComparativasGrupos;
