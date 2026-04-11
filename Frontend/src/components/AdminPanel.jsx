import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function AdminPanel() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard-stats')
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!data) return <div className="p-8 text-center">Cargando estadísticas...</div>;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'Estudiantes', val: data.stats.estudiantes, icon: '👨‍🎓' },
          { title: 'Proyectos', val: data.stats.proyectos, icon: '📁' },
          { title: 'Pasantías', val: data.stats.pasantias, icon: '🧪' },
          { title: 'Seminarios', val: data.stats.seminarios, icon: '📚' }
        ].map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">{card.title}</p>
            <p className="text-3xl font-bold text-gray-900">{card.val}</p>
            <span className="text-2xl">{card.icon}</span>
          </div>
        ))}
      </div>

      {/* Notificación de Pendientes */}
      <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-yellow-800">Solicitudes Pendientes</h3>
          <p className="text-yellow-700">Tienes {data.stats.pendientes} nuevos usuarios esperando aprobación.</p>
        </div>
        <button className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition">
          Revisar Solicitudes
        </button>
      </div>
    </div>
  );
}