// components/EstadisticasColaboracion.tsx
import React, { useEffect, useState } from 'react';
import { Paper, Typography } from '@mui/material';
import ReactEcharts from 'echarts-for-react';

interface ColaboracionAnualData {
  xAxis: string[];
  thisYear: number[];
  lastYear: number[];
}

const EstadisticasColaboracion: React.FC = () => {
  const [data, setData] = useState<ColaboracionAnualData | null>(null);

  useEffect(() => {
    fetch('/api//stadistics/api/estadisticas/colaboracion_anual')
      .then(response => response.json())
      .then(data => setData(data))
      .catch(error => console.error('Error fetching collaboration yearly data:', error));
  }, []);

  const getOption = () => {
    if (!data) {
      return {};
    }

    return {
      grid: { top: '10%', bottom: '10%', left: '5%', right: '5%' },
      legend: {
        itemGap: 20,
        icon: 'circle',
        textStyle: {
          fontSize: 13,
          color: '#ccc',
          fontFamily: 'Roboto',
        },
      },
      xAxis: {
        type: 'category',
        data: data.xAxis,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 14,
          fontFamily: 'Roboto',
          color: '#ccc',
        },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: { color: '#ccc', opacity: 0.15 },
        },
        axisLabel: { color: '#ccc', fontSize: 13, fontFamily: 'Roboto' },
      },
      series: [
        {
          data: data.thisYear,
          type: 'line',
          name: 'Este año',
          smooth: true,
          symbolSize: 4,
          lineStyle: { width: 4 },
        },
        {
          data: data.lastYear,
          type: 'line',
          name: 'Año pasado',
          smooth: true,
          symbolSize: 4,
          lineStyle: { width: 4 },
        },
      ],
      color: ['#00bcd4', '#ff5722'],
    };
  };

  return (
    <Paper elevation={3} sx={{ padding: 2 }}>
      <Typography variant="h5">Colaboraciones por Mes</Typography>
      {data ? (
        <>
          <ReactEcharts style={{ height: '350px' }} option={getOption()} />
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Este gráfico muestra la cantidad de colaboraciones realizadas cada mes, comparando el año actual con el año anterior.
            Se incluyen métricas como commits y pull requests para analizar la evolución de la actividad colaborativa anual.
          </Typography>
        </>
      ) : (
        <Typography>Cargando datos...</Typography>
      )}
    </Paper>
  );
};

export default EstadisticasColaboracion;
