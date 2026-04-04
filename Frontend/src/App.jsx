import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';

import Inicio from './pages/admin/Inicio_Admin';
import Usuarios from './pages/admin/Usuarios';
import Modalidades from './pages/admin/Modalidades';
import Reportes from './pages/admin/Reportes';
import Registro from './pages/Registro'; // 1. IMPORTAR ARRIBA

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Opción 1: Redirigir la raíz al login automáticamente */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={<Login />} />

        {/* Ruta para el registro */}
        <Route path="/registro" element={<Registro />} />
        
        {/* Rutas protegidas para el administrador */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Inicio />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="modalidades" element={<Modalidades />} />
          <Route path="reportes" element={<Reportes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;