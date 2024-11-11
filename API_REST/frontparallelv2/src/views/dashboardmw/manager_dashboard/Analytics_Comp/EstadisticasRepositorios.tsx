// components/EstadisticasRepositorios.tsx
import React, { useEffect, useState } from 'react';
import { Paper, Typography } from '@mui/material';
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
    fetch('http://localhost:8000/stadistics/api/estadisticas/repositorios')
      .then(response => response.json())
      .then(data => setData(data))
      .catch(error => console.error('Error fetching repository data:', error));
  }, []);

  const getOption = () => {
    if (!data) {
      return {};
    }

    const lenguajes = Object.keys(data.lenguajes);
    const cantidades = Object.values(data.lenguajes);

    return {
      tooltip: {
        trigger: 'item',
      },
      legend: {
        top: 'bottom',
        textStyle: { color: '#ccc' },
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
          label: {
            show: false,
            position: 'center',
            color: '#fff',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '16',
              fontWeight: 'bold',
              color: '#fff',
            },
          },
          labelLine: {
            show: false,
          },
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
    <Paper elevation={3} sx={{ padding: 2 }}>
      <Typography variant="h5">Estadísticas de Repositorios</Typography>
      {data ? (
        <>
          <ReactEcharts option={getOption()} style={{ height: '350px', width: '100%' }} />
          {/* Lista de repositorios */}
          {data.repositorios.map((repo, index) => (
            <div key={index}>
              <Typography>{repo.nombre}</Typography>
              <Typography color="textSecondary">
                Lenguaje: {repo.lenguaje} - Estrellas: {repo.estrellas}
              </Typography>
            </div>
          ))}
        </>
      ) : (
        <Typography>Cargando datos...</Typography>
      )}
    </Paper>
  );
};

export default EstadisticasRepositorios;
