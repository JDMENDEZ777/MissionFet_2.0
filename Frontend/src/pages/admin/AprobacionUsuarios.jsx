import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios'; // Ajusta la ruta de axios si es necesario
 import './AprobacionUsuarios.css'; // Lo descomentaremos cuando me des el CSS

export default function AprobacionUsuarios() {
  const navigate = useNavigate();
  const [navActive, setNavActive] = useState(false);
  
  // Estados para las tablas y mensajes
  const [solicitudes, setSolicitudes] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [mensaje, setMensaje] = useState({ text: '', type: '' });
  
  // Estados para la interfaz (Pestañas y Filtros)
  const [activeTab, setActiveTab] = useState('solicitudes'); // 'solicitudes' o 'historial'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('');

  // 1. Cargar datos al iniciar
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Esta ruta la crearemos en Laravel luego
      const response = await api.get('/admin/aprobaciones');
      setSolicitudes(response.data.solicitudes);
      setHistorial(response.data.historial);
    } catch (error) {
      mostrarMensaje('Error al cargar los datos', 'error');
    }
  };

  const mostrarMensaje = (text, type) => {
    setMensaje({ text, type });
    setTimeout(() => setMensaje({ text: '', type: '' }), 5000);
  };

  // 2. Funciones de Acción (Aprobar / Rechazar)
  const handleAprobar = async (id) => {
    try {
      await api.post(`/admin/aprobaciones/${id}/aprobar`);
      mostrarMensaje('Usuario aprobado y notificado correctamente', 'exito');
      fetchData(); // Recargar tablas
    } catch (error) {
      mostrarMensaje(error.response?.data?.message || 'Error al aprobar usuario', 'error');
    }
  };

  const handleRechazar = async (id) => {
    if (!window.confirm('¿Estás seguro de rechazar esta solicitud?')) return;
    
    try {
      await api.post(`/admin/aprobaciones/${id}/rechazar`);
      mostrarMensaje('Usuario rechazado correctamente', 'exito');
      fetchData(); // Recargar tablas
    } catch (error) {
      mostrarMensaje('Error al rechazar usuario', 'error');
    }
  };

  // 3. Lógica de Filtrado y Búsqueda (¡La magia de React!)
  const getFilteredData = (dataList) => {
    let filtered = dataList.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = item.nombre.toLowerCase().includes(searchLower) || item.email.toLowerCase().includes(searchLower);
      
      let matchFilter = true;
      if (filterValue === 'tutores') matchFilter = item.rol === 'tutor';
      if (filterValue === 'estudiantes') matchFilter = item.rol === 'estudiante';
      
      return matchSearch && matchFilter;
    });

    // Lógica de ordenamiento
    filtered.sort((a, b) => {
      if (filterValue === 'az') return a.nombre.localeCompare(b.nombre);
      if (filterValue === 'za') return b.nombre.localeCompare(a.nombre);
      
      // Fecha genérica (creada o de resolución)
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      
      if (filterValue === 'oldest') return dateA - dateB;
      return dateB - dateA; // 'recent' por defecto
    });

    return filtered;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className={`admin-layout ${navActive ? 'nav-active' : ''}`}>
      
      {/* HEADER / NAVBAR (Igual que en tu Inicio) */}
      <div id="logo" onClick={() => setNavActive(!navActive)}>
        <img src="/IMG/logofet.png" alt="Logo FET" className="logo-img" />
      </div>
      
      <nav id="navbar" className={navActive ? 'active' : ''}>
        <div className="nav-header">
          <div id="nav-logo" onClick={() => setNavActive(!navActive)}>
            <img src="/IMG/logofet.png" alt="Logo FET" className="logo-img" />
          </div>
          <ul>
            <li><Link to="/dashboard">Inicio</Link></li>
            <li><Link to="/aprobacion" className="active">Aprobación de Usuarios</Link></li>
            <li><Link to="/usuarios">Gestión de Usuarios</Link></li>
            <li className="dropdown">
              <a href="#">Gestión de Modalidades de Grado</a>
              <ul className="dropdown-content">
                <li><Link to="/seminarios">Seminario</Link></li>
                <li><Link to="/proyectos">Proyectos</Link></li>
                <li><Link to="/pasantias">Pasantías</Link></li>
              </ul>
            </li>
            <li><Link to="/reportes">Reportes y Estadísticas</Link></li>
            <li><a href="#" onClick={handleLogout}>Cerrar Sesión</a></li>
          </ul>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className={navActive ? 'nav-active' : ''}>
        <h1>Aprobación de Usuarios</h1>
        
        {mensaje.text && (
          <div className={`mensaje ${mensaje.type}`}>
            {mensaje.text}
          </div>
        )}
        
        {/* Controles de Búsqueda y Filtro */}
        <div className="filter-search-container">
          <div className="filter">
            <select value={filterValue} onChange={(e) => setFilterValue(e.target.value)}>
              <option value="">Filtrar por...</option>
              <option value="recent">Más reciente</option>
              <option value="oldest">Más antiguo</option>
              <option value="az">A-Z</option>
              <option value="za">Z-A</option>
              <option value="tutores">Tutores</option>
              <option value="estudiantes">Estudiantes</option>
            </select>
          </div>
          <div className="search">
            <input 
              type="text" 
              placeholder="Buscar por nombre o correo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Pestañas */}
        <div className="tabs">
          <button 
            className={activeTab === 'solicitudes' ? 'active' : ''} 
            onClick={() => setActiveTab('solicitudes')}
          >
            Solicitudes Pendientes
          </button>
          <button 
            className={activeTab === 'historial' ? 'active' : ''} 
            onClick={() => setActiveTab('historial')}
          >
            Historial
          </button>
        </div>

        {/* TABLA DE SOLICITUDES */}
        {activeTab === 'solicitudes' && (
          <div className="table-responsive">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Nombre completo</th>
                  <th>Rol</th>
                  <th>Documento</th>
                  <th>Código</th>
                  <th>Correo</th>
                  <th>Opción grado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredData(solicitudes).length === 0 ? (
                  <tr><td colSpan="7" style={{textAlign: 'center'}}>No hay solicitudes pendientes o que coincidan con la búsqueda</td></tr>
                ) : (
                  getFilteredData(solicitudes).map(solicitud => (
                    <tr key={solicitud.id}>
                      <td>{solicitud.nombre}</td>
                      <td>{solicitud.rol}</td>
                      <td>{solicitud.documento}</td>
                      <td>{solicitud.codigo_estudiante || solicitud.codigo_institucional || 'N/A'}</td>
                      <td>{solicitud.email}</td>
                      <td>{solicitud.opcion_grado || 'N/A'}</td>
                      <td>
                        <div className="action-buttons">
                          <button onClick={() => handleAprobar(solicitud.id)} className="btn-aprobar">✔ Aprobar</button>
                          <button onClick={() => handleRechazar(solicitud.id)} className="btn-rechazar">❌ Rechazar</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TABLA DE HISTORIAL */}
        {activeTab === 'historial' && (
          <div className="table-responsive">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th>Documento</th>
                  <th>Correo</th>
                  <th>Estado Final</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredData(historial).length === 0 ? (
                  <tr><td colSpan="5" style={{textAlign: 'center'}}>No hay registros en el historial</td></tr>
                ) : (
                  getFilteredData(historial).map(registro => (
                    <tr key={registro.id}>
                      <td>{registro.nombre}</td>
                      <td>{registro.rol}</td>
                      <td>{registro.documento}</td>
                      <td>{registro.email}</td>
                      <td>
                        <span className={`badge ${registro.estado_final === 'aprobado' ? 'estado-aprobado' : 'estado-rechazado'}`}>
                          {registro.estado_final === 'aprobado' ? '✅ Aprobado' : '❌ Rechazado'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </main>
    </div>
  );
}