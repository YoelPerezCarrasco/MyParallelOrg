import React, { Fragment, useState } from 'react';
import { Card, Grid, styled, useTheme } from '@mui/material';
import ModelStatusCard from './litis/ModelStatusCard';
import GamificationConfigCard from './litis/GamificationConfigCard';
import UserManagementCard from './litis/UserManagementCard';
import OrganizationManagementCard from './litis/OrganizationManagementCard';
import LoadingModal from './litis/LoadingModal';
import DatasetCard from './litis/DataSetCard'; // Importa DatasetCard

// Styled Components
const ContentBox = styled('div')(({ theme }) => ({
  margin: '30px',
  [theme.breakpoints.down('sm')]: { margin: '16px' },
}));

const Title = styled('span')(() => ({
  fontSize: '1rem',
  fontWeight: '500',
  marginRight: '.5rem',
  textTransform: 'capitalize',
}));

const SubTitle = styled('span')(({ theme }) => ({
  fontSize: '0.875rem',
  color: theme.palette.text.secondary,
}));

const H4 = styled('h4')(({ theme }) => ({
  fontSize: '1rem',
  fontWeight: '500',
  marginBottom: '16px',
  textTransform: 'capitalize',
  color: theme.palette.text.secondary,
}));

const AdminDashboard: React.FC = () => {
  const [showLoadingModal, setShowLoadingModal] = useState<boolean>(false);
  const { palette } = useTheme();

  return (
    <Fragment>
      <ContentBox>
        <Grid container spacing={3}>
          {/* Main Content Area */}
          <Grid item lg={8} md={8} sm={12} xs={12}>
            <Card sx={{ px: 3, py: 2, mb: 3 }}>
              <Title>Model Status</Title>
              <SubTitle>Machine Learning Model Status</SubTitle>
              <ModelStatusCard />
            </Card>
            
            <Card sx={{ px: 3, py: 2, mb: 3 }}>
              <Title>Gamification Configuration</Title>
              <SubTitle>Manage Points for User Actions</SubTitle>
              <GamificationConfigCard />
            </Card>

            <H4>User Management</H4>
            <UserManagementCard />

            <Card sx={{ px: 3, py: 2, mb: 3 }}>
              <Title>Dataset Generator</Title>
              <SubTitle>Generate Dataset for Training</SubTitle>
              <DatasetCard />
            </Card>
          </Grid>

          {/* Sidebar Area */}
          <Grid item lg={4} md={4} sm={12} xs={12}>
            <Card sx={{ px: 3, py: 2, mb: 3 }}>
              <Title>Organization Management</Title>
              <SubTitle>Control Registered Organizations</SubTitle>
              <OrganizationManagementCard />
            </Card>
          </Grid>
        </Grid>

        {/* Loading Modal */}
        <LoadingModal open={showLoadingModal} />
      </ContentBox>
    </Fragment>
  );
};

export default AdminDashboard;
