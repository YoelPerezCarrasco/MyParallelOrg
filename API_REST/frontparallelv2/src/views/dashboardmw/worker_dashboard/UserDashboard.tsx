// UserDashboard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AffinityTable from './AffinityTable';
import UserWorkGroup from './UserWorkGroup';
import { Container, Grid } from '@mui/material';


const UserDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Verificar si el usuario está autenticado
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  return (
        <Container maxWidth={false} disableGutters sx={{ height: '200vh', overflow: 'hidden', padding: 2 }}>
      <Grid container spacing={4}>
        {/* Componente de Grupo de Trabajo del Usuario */}
        <Grid item xs={12} md={6}>
          <UserWorkGroup />
        </Grid>

        {/* Componente de Tabla de Afinidad */}
        <Grid item xs={12} md={6}>
          <AffinityTable />
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserDashboard;
