import { useEffect, useState } from 'react';
// import TutorPanel from '../components/TutorPanel'; // Luego los creamos

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Aquí puedes recuperar el usuario guardado tras el login
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
  }, []);

  if (!user) return <div>Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Bienvenido, {user.name}</h1>
      
      {/* Renderizado condicional */}
      {user.role === 'admin' && <AdminPanel />}
      {user.role === 'tutor' && <div>Panel del Tutor</div>}
      {user.role === 'estudiante' && <div>Panel del Estudiante</div>}
    </div>
  );
}