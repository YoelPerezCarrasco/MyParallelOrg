import React from 'react';
import { Card, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const UserManagementCard: React.FC = () => {
  return (
    <Card>
      <Typography variant="h5">Gestión de Usuarios</Typography>
      <Typography variant="body1">Gestiona los usuarios registrados en la plataforma.</Typography>
      <Button variant="contained" component={Link} to="/admin/users/list">
        Ver Usuarios
      </Button>
      <Button variant="contained" component={Link} to="/admin/users/create">
        Crear Usuario
      </Button>
    </Card>
  );
};

export default UserManagementCard;
