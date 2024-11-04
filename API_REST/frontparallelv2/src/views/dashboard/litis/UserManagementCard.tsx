import React from 'react';
import { Card, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';

const UserManagementCard: React.FC = () => {
  return (
    <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Typography variant="h5" gutterBottom>
        Gestión de Usuarios
      </Typography>
      <Typography variant="body1" align="center">
        Gestiona los usuarios registrados en la plataforma.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button variant="contained" color="primary" component={Link} to="/admin/users/list">
          Ver Usuarios
        </Button>
        <Button variant="outlined" color="primary" component={Link} to="/admin/users/create">
          Crear Usuario
        </Button>
      </Box>
    </Card>
  );
};

export default UserManagementCard;
