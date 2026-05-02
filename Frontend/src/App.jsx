import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import AprobacionUsuarios from './pages/admin/AprobacionUsuarios';
import Inicio from './pages/admin/Inicio_Admin';
import Usuarios from './pages/admin/Usuarios';
import Modalidades from './pages/admin/Modalidades';
import Reportes from './pages/admin/Reportes';
import Registro from './pages/Registro'; // 1. IMPORTAR ARRIBA
import GestionUsuarios from './pages/admin/GestionUsuarios'; // Ajusta la ruta si es diferente
import GestionSeminario from './pages/admin/GestionSeminario'; // Nueva página para gestionar seminarios
import GestionProyectos from './pages/admin/GestionProyectos'; // Nueva página para gestionar proyectos
import GestionPasantias from './pages/admin/GestionPasantias'; // Nueva página para gestionar pasantías
import TutorDashboard from './pages/tutores/tutor'; // Nueva página para el portal del tutor

// Forzando el reload de Vite...

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Opción 1: Redirigir la raíz al login automáticamente */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={<Login />} />

        {/* Ruta para el registro */}
        <Route path="/registro" element={<Registro />} />

        <Route path="/aprobacion" element={
          <ProtectedRoute allowedRoles={['admin']}><AprobacionUsuarios /></ProtectedRoute>
        } />

        <Route path="/usuarios" element={
          <ProtectedRoute allowedRoles={['admin']}><GestionUsuarios /></ProtectedRoute>
        } />

        <Route path="/seminarios" element={
          <ProtectedRoute allowedRoles={['admin']}><GestionSeminario /></ProtectedRoute>
        } />

        <Route path="/proyectos" element={
          <ProtectedRoute allowedRoles={['admin']}><GestionProyectos /></ProtectedRoute>
        } />

        <Route path="/pasantias" element={
          <ProtectedRoute allowedRoles={['admin']}><GestionPasantias /></ProtectedRoute>
        } />

        <Route path="/reportes" element={
          <ProtectedRoute allowedRoles={['admin']}><Reportes /></ProtectedRoute>
        } />
        
        {/* Rutas para el Tutor */}
        <Route path="/tutor/dashboard" element={
          <ProtectedRoute allowedRoles={['tutor']}>
            <TutorDashboard />
          </ProtectedRoute>
        } />
        
        {/* Rutas protegidas para el administrador */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
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