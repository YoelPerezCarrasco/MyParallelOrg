import React from 'react';
import { Card, Grid, styled, useTheme } from '@mui/material';
import ModelStatusCard from './litis/ModelStatusCard';
import GamificationConfigCard from './litis/GamificationConfigCard';
import UserManagementCard from './litis/UserManagementCard';
import OrganizationManagementCard from './litis/OrganizationManagementCard';
import LoadingModal from './litis/LoadingModal';
import DatasetCard from './litis/DataSetCard';
import GroupManagementCard from './litis/GroupManagementCard';

// Styled Components
const ContentBox = styled('div')(({ theme }) => ({
  margin: theme.spacing(4),
  [theme.breakpoints.down('sm')]: { margin: theme.spacing(2) },
}));

const SectionTitle = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const Title = styled('h2')(({ theme }) => ({
  fontSize: '1.5rem',
  fontWeight: 600,
  margin: 0,
  color: theme.palette.text.primary,
}));

const SubTitle = styled('p')(({ theme }) => ({
  fontSize: '1rem',
  margin: 0,
  color: theme.palette.text.secondary,
}));

const AdminDashboard: React.FC = () => {
  const [showLoadingModal, setShowLoadingModal] = React.useState<boolean>(false);
  const theme = useTheme();

  return (
    <ContentBox>
      <Grid container spacing={3}>
        {/* Área Principal */}
        <Grid item xs={12} md={4}>
          {/* Sección de Estado del Modelo */}
          <Card sx={{ px: 3, py: 2, mb: 3 }}>
            <SectionTitle>
              <Title>Estado del Modelo</Title>
              <SubTitle>Estado del Modelo de Machine Learning</SubTitle>
            </SectionTitle>
            <ModelStatusCard />
          </Card>
          {/* Sección de Gestión de Grupos */}
          <Card sx={{ px: 3, py: 2, mb: 3 }}>
            <SectionTitle>
              <Title>Gestión de Grupos</Title>
              <SubTitle>Genera grupos de trabajo por empresa</SubTitle>
            </SectionTitle>
            <GroupManagementCard />
          </Card>
        </Grid>

        {/* Área Lateral */}
        <Grid item xs={12} md={4}>
          <Card sx={{ px: 3, py: 2, mb: 3 }}>
            <SectionTitle>
              <Title>Gestión de Organizaciones</Title>
              <SubTitle>Controla las organizaciones registradas</SubTitle>
            </SectionTitle>
            <OrganizationManagementCard />
          </Card>


         {/* Sección de Configuración de Gamificación */}
         <Card sx={{ px: 3, py: 2, mb: 3 }}>
            <SectionTitle>
              <Title>Configuración de Gamificación</Title>
              <SubTitle>Gestiona los puntos por acciones de usuario</SubTitle>
            </SectionTitle>
            <GamificationConfigCard />
          </Card>


        </Grid>

      {/* Área Lateral */}
      <Grid item xs={12} md={4}>
          {/* Sección de Gestión de Usuarios */}
          <Card sx={{ px: 3, py: 2, mb: 3 }}>
            <SectionTitle>
              <Title>Gestión de Usuarios</Title>
              <SubTitle>Administra los usuarios del sistema</SubTitle>
            </SectionTitle>
            <UserManagementCard />
          </Card>

          {/* Sección de Generación de Dataset */}
          <Card sx={{ px: 3, py: 2, mb: 3 }}>
            <SectionTitle>
              <Title>Generador de Dataset</Title>
              <SubTitle>Genera datasets para entrenamiento</SubTitle>
            </SectionTitle>
            <DatasetCard />
          </Card>

        </Grid>


      
      </Grid>

      

      {/* Modal de Carga */}
      <LoadingModal open={showLoadingModal} />
    </ContentBox>
  );
};

export default AdminDashboard;
