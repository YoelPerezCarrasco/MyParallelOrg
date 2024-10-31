import React from 'react';
import { Modal, CircularProgress, Typography, Box } from '@mui/material';

interface LoadingModalProps {
  open: boolean;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ open }) => {
  return (
    <Modal open={open}>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        bgcolor="background.paper"
      >
        <CircularProgress />
        <Typography variant="h6" align="center" style={{ marginTop: 16 }}>
          Esperando mientras se cargan los datos de la empresa, esto puede tardar unos minutos...
        </Typography>
      </Box>
    </Modal>
  );
};

export default LoadingModal;
