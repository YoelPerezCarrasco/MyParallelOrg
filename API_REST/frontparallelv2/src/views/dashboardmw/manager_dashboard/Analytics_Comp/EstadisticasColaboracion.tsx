// components/EstadisticasColaboracion.tsx
import React, { useEffect, useState } from 'react';
import { Paper, Typography } from '@mui/material';
import ReactEcharts from 'echarts-for-react';

interface ColaboracionTiempoData {
  xAxis: string[];
  thisMonth: number[];
  lastMonth: number[];
}

const EstadisticasColaboracion: React.FC = () => {
  const [data, setData] = useState<ColaboracionTiempoData | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/stadistics/api/estadisticas/colaboracion_tiempo')
      .then(response => response.json())
      .then(data => setData(data))
      .catch(error => console.error('Error fetching collaboration time data:', error));
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
          data: data.thisMonth,
          type: 'line',
          name: 'Este mes',
          smooth: true,
          symbolSize: 4,
          lineStyle: { width: 4 },
        },
        {
          data: data.lastMonth,
          type: 'line',
          name: 'Mes pasado',
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
      <Typography variant="h5">Colaboraciones por Día</Typography>
      {data ? (
        <><ReactEcharts style={{ height: '350px' }} option={getOption()} /><Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                  Este gráfico muestra la cantidad de colaboraciones realizadas por día en la plataforma,
                  comparando el mes actual con el mes anterior. Se incluyen commits y pull requests, lo que
                  permite analizar la evolución de la actividad colaborativa.
              </Typography></>
        
      ) : (
        <Typography>Cargando datos...</Typography>
      )}
    </Paper>
  );
};

export default EstadisticasColaboracion;
