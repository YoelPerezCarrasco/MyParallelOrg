// components/Dashboard.tsx
import React from 'react';
import Messages from './messeges/Messeges'; // Asegúrate de que la ruta sea correcta
import { Outlet } from 'react-router-dom';

const Dashboard: React.FC = () => {
  return (
    <div>
      {/* Aquí puedes tener un header o navbar común */}
      <div className="d-flex">
        {/* Componente de mensajes fijo al lado izquierdo */}
        <div style={{ width: '300px', position: 'fixed', height: '100vh', overflowY: 'auto' }}>
          <Messages />
        </div>
        {/* Contenido principal, con margen para evitar solapamiento */}
        <div style={{ marginLeft: '300px', padding: '20px', width: '100%' }}>
          <Outlet /> {/* Aquí se renderizará el contenido específico del worker o manager */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;