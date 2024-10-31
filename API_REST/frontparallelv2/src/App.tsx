import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Homepage from './views/Home';
import Loginpage from './views/Loginv2';
import UserDashboard from './views/UserDashboard';
import AdminDashboard from './../src/views/dashboard/AdminDashboard';
import UserList from './views/cruds/UserList';
import CreateUser from './views/cruds/CreateUser';
import Navbar from './components/Layout/Navbar';
import { RequireAdminToken } from './utils/RequireAdminToken';
import Registerpage from './views/RegisterPage';
import	UserGraph from './views/UserGraph';  // Importa el componente UserGraph
import Setting from './views/Setting';
import ManagerDashboard from './views/ManagerDashboard';
import { RequireManagerToken } from './utils/RequireManagerToken';
import Layout1Topbar from './components/Layout/Layout1TopBar';

// index.js o index.tsx

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import CssBaseline from "@mui/material/CssBaseline";



const App: React.FC = () => {
  return (
    <AuthProvider>
      <Layout1Topbar />
        <Navbar />
      
      <section className="home-section ">
      <Routes>
        <Route
          path="/user/dashboard"
          element={<UserDashboard />}
        />
         <Route
          path="/manager/dashboard"
          element={<RequireManagerToken><ManagerDashboard /></RequireManagerToken>}
        />
        <Route
          path="/admin/dashboard"
          element={<RequireAdminToken><AdminDashboard /></RequireAdminToken>}
        />
        <Route
          path="/admin/users/list"
          element={<RequireAdminToken><UserList /></RequireAdminToken>}
        />
        <Route
          path="/admin/users/create"
          element={<RequireAdminToken><CreateUser /></RequireAdminToken>}
        />
      
        <Route path="/graphs/:organization" element={<UserGraph />} />  {/* Esta es la ruta que captura el parámetro organization */}

        <Route path="/login" element={<Loginpage />} />
        <Route path="/register" element={<Registerpage />} />
        <Route path="/settings" element={<Setting />} />

        <Route path="/" element={<Homepage />} />
      </Routes>
      </section>
    </AuthProvider>
  );
}

export default App;