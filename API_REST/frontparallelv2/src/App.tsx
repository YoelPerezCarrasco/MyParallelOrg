// App.tsx
import React, { useContext, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import AuthContext, { AuthProvider } from './context/AuthContext';
import Homepage from './views/Home';
import Loginpage from './views/Loginv2';
import UserDashboard from './views/dashboardmw/worker_dashboard/UserDashboard';
import AdminDashboard from './views/dashboard/AdminDashboard';
import UserList from './views/cruds/UserList';
import CreateUser from './views/cruds/CreateUser';
import Navbar from './components/Layout/Navbar';
import { RequireAdminToken } from './utils/RequireAdminToken';
import Registerpage from './views/RegisterPage';
import UserGraph from './views/UserGraph';
import Setting from './views/Setting';
import { RequireManagerToken } from './utils/RequireManagerToken';
import Layout1Topbar from './components/Layout/Layout1TopBar';
import Messages from './views/dashboardmw/messeges/Messeges';
import ManagerContent from './views/dashboardmw/manager_dashboard/ManagerContent';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import CssBaseline from '@mui/material/CssBaseline';
import { styled } from '@mui/material/styles';
import WorkerContent from './views/dashboardmw/worker_dashboard/WorkerContent';
import Dashboard from './views/dashboardmw/manager_dashboard/Stadistics';


const RootContainer = styled('div')({
  /* Estilos del scrollbar */
  // ...tus estilos existentes
});

const AppContent: React.FC = () => {
  const { authTokens, getUserRole } = useContext(AuthContext);
  const { role } = getUserRole(authTokens);
  const [isChatOpen, setIsChatOpen] = useState(false);


  return (
    <>
      <Layout1Topbar isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} />
        {/* Resto de tu código */}

        {/* Mostrar el chat si isChatOpen es true */}
        {isChatOpen && (
          <div
            style={{
              position: 'fixed',
              top: 70,
              right: 0,
              width: '1000px',
              height: '600px',
              backgroundColor: '#fff',
              boxShadow: '0 0 10px rgba(0,0,0,0.3)',
              zIndex: 1000,
            }}
          >
            <Messages />
          </div>
        )}
      <Navbar />
      <CssBaseline />
      <section className="home-section">
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Loginpage />} />
          <Route path="/register" element={<Registerpage />} />
          <Route path="/" element={<Homepage />} />
          <Route path="/settings" element={<Setting />} />
          

          {/* Rutas protegidas por autenticación */}
          {role && (
            <>
              {role === 'admin' && (
                <Route path="/admin/*" element={<RequireAdminToken><AdminRoutes /></RequireAdminToken>} />
              )}

              {role === 'manager' && (
                <Route path="/manager/*" element={<RequireManagerToken><ManagerRoutes /></RequireManagerToken>} />
              )}

              {role === 'worker' && (
                <Route path="/user/*" element={<WorkerRoutes />} />
              )}
            </>
          )}
        </Routes>
      </section>
    </>
  );
};

// Componentes de rutas específicas por rol
const AdminRoutes: React.FC = () => (
  <Routes>
    <Route path="dashboard" element={<AdminDashboard />} />
    <Route path="users/list" element={<UserList />} />
    <Route path="users/create" element={<CreateUser />} />
    <Route path="/graphs/:organization" element={<UserGraph />} />

    {/* Agrega más rutas de administrador aquí */}
  </Routes>
);

const ManagerRoutes: React.FC = () => (
  <Routes>
    <Route path="dashboard" element={<ManagerContent />} />
    <Route path="/graphs/:organization" element={<UserGraph />} />
    <Route path="analytics" element={<Dashboard />} />

    {/* Agrega más rutas de manager aquí */}
  </Routes>
);

const WorkerRoutes: React.FC = () => (
  <Routes>
    <Route path="dashboard" element={<WorkerContent />} />
    {/* Agrega más rutas de trabajador aquí */}
  </Routes>
);

const App: React.FC = () => {
  return (
    <RootContainer>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </RootContainer>
  );
};

export default App;
