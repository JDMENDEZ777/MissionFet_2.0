import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  
  // 1. Si no hay token, redirige al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si hay roles permitidos definidos, verificar el rol del usuario
  if (allowedRoles && !allowedRoles.includes(user?.rol)) {
    // Si el rol no coincide, redirigir a su dashboard correspondiente según su rol real
    if (user?.rol === 'tutor') return <Navigate to="/tutor/dashboard" replace />;
    if (user?.rol === 'estudiante') return <Navigate to="/estudiante/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}