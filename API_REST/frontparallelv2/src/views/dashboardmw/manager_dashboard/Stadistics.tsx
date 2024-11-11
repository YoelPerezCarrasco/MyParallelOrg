// components/Dashboard.tsx
import React from 'react';
import { Grid } from '@mui/material';
import ResumenGeneral from './Analytics_Comp/ResumenGeneral';
import RendimientoModelo from './Analytics_Comp/RendimientoModelo';
import EstadisticasColaboracion from './Analytics_Comp/EstadisticasColaboracion';
import EstadisticasRepositorios from './Analytics_Comp/EstadisticasRepositorios';
import ComparativasGrupos from './Analytics_Comp/ComparativasGrupos';

const Dashboard: React.FC = () => {
  return (
    <Grid container spacing={3} sx={{ padding: 3 }}>
      {/* Resumen General */}
      <Grid item xs={12} sx={{ mb: 2 }}>
        <ResumenGeneral />
      </Grid>

      {/* Gráficos Principales */}
      <Grid item xs={12} sx={{ mb: 2 }}>
      </Grid>

      {/* Sección de Estadísticas de Colaboración */}
      <Grid item xs={12} sx={{ mb: 2 }}>
        <EstadisticasColaboracion />
      </Grid>

      {/* Sección Inferior */}
      <Grid item xs={12} sx={{ mb: 2 }}>
        <EstadisticasRepositorios />
      </Grid>
      
      <Grid item xs={12} sx={{ mb: 2 }}>
        <ComparativasGrupos />
      </Grid>
    </Grid>
  );
};

export default Dashboard;
