import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Homepage from './views/Home';
import Loginpage from './views/Loginv2';
import UserDashboard from './views/UserDashboard';
import AdminDashboard from './views/AdminDashboard';
import UserList from './views/cruds/UserList';
import CreateUser from './views/cruds/CreateUser';
import EditUser from './views/cruds/EditUser';
import Navbar from './views/Navbar';
import PrivateRoute from './utils/PrivateRoute';
import { RequireAdminToken } from './utils/RequireAdminToken';
import Registerpage from './views/RegisterPage';
import	UserGraph from './views/UserGraph';  // Importa el componente UserGraph
import Setting from './views/Setting';
import ManagerDashboard from './views/ManagerDashboard';
import { RequireManagerToken } from './utils/RequireManagerToken';


// index.js o index.tsx

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Navbar />
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
          path="/admin/users"
          element={<RequireAdminToken><UserList /></RequireAdminToken>}
        />
        <Route
          path="/admin/users/create"
          element={<RequireAdminToken><CreateUser /></RequireAdminToken>}
        />
        <Route
          path="/admin/users/edit/:id"
          element={<RequireAdminToken><EditUser /></RequireAdminToken>}
        />
        <Route path="/graphs/:organization" element={<UserGraph />} />  {/* Esta es la ruta que captura el parámetro organization */}

        <Route path="/login" element={<Loginpage />} />
        <Route path="/register" element={<Registerpage />} />
        <Route path="/settings" element={<Setting />} />

        <Route path="/" element={<Homepage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
