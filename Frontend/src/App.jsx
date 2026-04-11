import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login               from './pages/Login';
import Dashboard           from './pages/Dashboard';
import ProtectedRoute      from './components/ProtectedRoute';
import AdminLayout         from './components/AdminLayout';
import AprobacionUsuarios  from './pages/admin/AprobacionUsuarios';
import Inicio              from './pages/admin/Inicio_Admin';
import Usuarios            from './pages/admin/Usuarios';
import Modalidades         from './pages/admin/Modalidades';
import Reportes            from './pages/admin/Reportes';
import Registro            from './pages/Registro';
import GestionUsuarios     from './pages/admin/GestionUsuarios';
import GestionSeminario    from './pages/admin/GestionSeminario';
import GestionProyectos    from './pages/admin/GestionProyectos';

// ── Nuevas vistas: Tutor y Estudiante de Seminario ───────────
import TutorSeminario      from './pages/tutor/TutorSeminario';
import EstudianteSeminario from './pages/estudiante/EstudianteSeminario';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Raíz → Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Rutas públicas */}
        <Route path="/login"    element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        {/* Rutas legacy sin ProtectedRoute (admin) */}
        <Route path="/aprobacion" element={<AprobacionUsuarios />} />
        <Route path="/usuarios"   element={<GestionUsuarios />} />
        <Route path="/seminarios" element={<GestionSeminario />} />
        <Route path="/proyectos"  element={<GestionProyectos />} />

        {/* ── Dashboard del Tutor de Seminario ─────────────── */}
        <Route
          path="/tutor/seminario"
          element={
            <ProtectedRoute>
              <TutorSeminario />
            </ProtectedRoute>
          }
        />

        {/* ── Dashboard del Estudiante de Seminario ─────────── */}
        <Route
          path="/estudiante/seminario"
          element={
            <ProtectedRoute>
              <EstudianteSeminario />
            </ProtectedRoute>
          }
        />

        {/* Rutas protegidas del admin */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index           element={<Inicio />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="modalidades" element={<Modalidades />} />
          <Route path="reportes"    element={<Reportes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;