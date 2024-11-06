// components/WorkerContent.tsx
import React from 'react';
import UserDashboard from './UserDashboard'; // Asegúrate de que la ruta sea correcta

const WorkerContent: React.FC = () => {
  return (
    <div>
      {/* Contenido específico para el worker */}
      <UserDashboard />
    </div>
  );
};

export default WorkerContent;
