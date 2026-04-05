import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios'; // Tu configuración de Axios
import './Inicio_Admin.css'; // css 

export default function InicioAdmin() {
  const navigate = useNavigate();
  const [navActive, setNavActive] = useState(false);
  
  // Aquí guardaremos toda la información que antes traías con PHP PDO
  const [dashboardData, setDashboardData] = useState({
    nombreUsuario: 'Administrador',
    usuariosPendientesCount: 0,
    totalEstudiantes: 0,
    totalProyectos: 0,
    totalPasantias: 0,
    totalSeminarios: 0,
    proyectosRecientes: [],
    seminariosRecientes: [],
    pasantiasRecientes: []
  });

  // Efecto para cargar los datos cuando el componente se monta
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Esta ruta la crearemos en Laravel en el siguiente paso
        const response = await api.get('/admin/dashboard');
        setDashboardData(response.data);
      } catch (error) {
        console.error("Error al cargar los datos:", error);
      }
    };

    fetchDashboardData();
  }, []);

  const toggleNav = () => {
    setNavActive(!navActive);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    // Agregamos las clases dinámicas para el menú lateral
    <div className={`admin-layout ${navActive ? 'nav-active' : ''}`}>
      
      <div id="logo" onClick={toggleNav}>
        <img src="/IMG/logofet.png" alt="Logo FET" className="logo-img" />
      </div>
      
      <nav id="navbar" className={navActive ? 'active' : ''}>
        <div className="nav-header">
          <div id="nav-logo" onClick={toggleNav}>
            <img src="/IMG/logofet.png" alt="Logo FET" className="logo-img" />
          </div>
          <ul>
            <li><Link to="/dashboard" className="active">Inicio</Link></li>
            <li><Link to="/aprobacion">Aprobación de Usuarios</Link></li>
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
            <li><a href="#">Rol: {dashboardData.nombreUsuario}</a></li>
            <li><a href="#" onClick={handleLogout}>Cerrar Sesión</a></li>
          </ul>
        </div>
      </nav>

      <main className={navActive ? 'nav-active' : ''}>
        <h1>Panel de Administración</h1>
        
        <section className="dashboard-section">
          <h2>Resumen General</h2>
          
          <div className="dashboard-cards">
            <div className="dashboard-card">
              <div className="card-icon">👨‍🎓</div>
              <div className="card-title">Estudiantes Activos</div>
              <div className="card-value">{dashboardData.totalEstudiantes}</div>
            </div>
            
            <div className="dashboard-card">
              <div className="card-icon">📁</div>
              <div className="card-title">Proyectos</div>
              <div className="card-value">{dashboardData.totalProyectos}</div>
            </div>
            
            <div className="dashboard-card">
              <div className="card-icon">🧪</div>
              <div className="card-title">Pasantías</div>
              <div className="card-value">{dashboardData.totalPasantias}</div>
            </div>
            
            <div className="dashboard-card">
              <div className="card-icon">📚</div>
              <div className="card-title">Seminarios</div>
              <div className="card-value">{dashboardData.totalSeminarios}</div>
            </div>
          </div>
        </section>
        
        <section className="dashboard-section" id="resumen-aprobaciones">
          <h2>Usuarios Pendientes de Aprobación</h2>
          <div className="aprobaciones-card">
            <div className="aprobaciones-icon">🔔</div>
            <div className="aprobaciones-info">
              <p>{dashboardData.usuariosPendientesCount} solicitudes pendientes de aprobación</p>
              <Link to="/aprobacion" className="btn-primary">Revisar Solicitudes</Link>
            </div>
          </div>
        </section>

        <section className="dashboard-section" id="accesos-rapidos">
          <h2>Accesos Rápidos</h2>
          <div className="accesos-container">
            <div className="acceso-card">
              <div className="acceso-header">
                <h3>Proyectos</h3>
                <div className="acceso-icon">📁</div>
              </div>
              <div className="acceso-body">
                <p>Gestione los proyectos de grado, asigne tutores y realice seguimiento.</p>
                <Link to="/proyectos" className="btn-primary">Ir a Proyectos</Link>
              </div>
            </div>
            
            <div className="acceso-card">
              <div className="acceso-header">
                <h3>Seminarios</h3>
                <div className="acceso-icon">📚</div>
              </div>
              <div className="acceso-body">
                <p>Administre los seminarios, inscripciones y calificaciones.</p>
                <Link to="/seminarios" className="btn-primary">Ir a Seminarios</Link>
              </div>
            </div>
            
            <div className="acceso-card">
              <div className="acceso-header">
                <h3>Pasantías</h3>
                <div className="acceso-icon">🧪</div>
              </div>
              <div className="acceso-body">
                <p>Gestione las pasantías, empresas y seguimiento de estudiantes.</p>
                <Link to="/pasantias" className="btn-primary">Ir a Pasantías</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-section" id="elementos-recientes">
          <h2>Elementos Recientes</h2>
          
          <div className="recientes-container">
            {/* PROYECTOS RECIENTES */}
            <div className="recientes-card">
              <h3>Proyectos Recientes</h3>
              <div className="recientes-list">
                {dashboardData.proyectosRecientes.length > 0 ? (
                  dashboardData.proyectosRecientes.map((proyecto, index) => (
                    <div className="reciente-item" key={index}>
                      <div className="reciente-info">
                        <h4>{proyecto.titulo}</h4>
                        <p><strong>Tutor:</strong> {proyecto.tutor_nombre || 'No asignado'}</p>
                        <p><strong>Estado:</strong> 
                          <span className={`badge estado-${proyecto.estado.replace('_', '-')}`}>
                            {proyecto.estado.replace('_', ' ').charAt(0).toUpperCase() + proyecto.estado.replace('_', ' ').slice(1)}
                          </span>
                        </p>
                        <p><strong>Fecha:</strong> {new Date(proyecto.fecha_creacion).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data">No hay proyectos recientes.</p>
                )}
              </div>
              <Link to="/proyectos" className="ver-todos">Ver todos los proyectos</Link>
            </div>
            
            {/* SEMINARIOS RECIENTES */}
            <div className="recientes-card">
              <h3>Seminarios Recientes</h3>
              <div className="recientes-list">
                {dashboardData.seminariosRecientes.length > 0 ? (
                  dashboardData.seminariosRecientes.map((seminario, index) => (
                    <div className="reciente-item" key={index}>
                      <div className="reciente-info">
                        <h4>{seminario.titulo}</h4>
                        <p><strong>Tutor:</strong> {seminario.tutor_nombre || 'No asignado'}</p>
                        <p><strong>Estado:</strong> 
                          <span className={`badge estado-${seminario.estado}`}>
                            {seminario.estado.charAt(0).toUpperCase() + seminario.estado.slice(1)}
                          </span>
                        </p>
                        <p><strong>Fecha:</strong> {new Date(seminario.fecha).toLocaleDateString('es-ES')}</p>
                        <p><strong>Inscritos:</strong> {seminario.num_inscritos}/{seminario.cupos}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data">No hay seminarios recientes.</p>
                )}
              </div>
              <Link to="/seminarios" className="ver-todos">Ver todos los seminarios</Link>
            </div>
            
            {/* PASANTÍAS RECIENTES */}
            <div className="recientes-card">
              <h3>Pasantías Recientes</h3>
              <div className="recientes-list">
                {dashboardData.pasantiasRecientes.length > 0 ? (
                  dashboardData.pasantiasRecientes.map((pasantia, index) => (
                    <div className="reciente-item" key={index}>
                      <div className="reciente-info">
                        <h4>{pasantia.titulo}</h4>
                        <p><strong>Estudiante:</strong> {pasantia.estudiante_nombre || 'No asignado'}</p>
                        <p><strong>Empresa:</strong> {pasantia.empresa}</p>
                        <p><strong>Estado:</strong> 
                          <span className={`badge estado-${pasantia.estado.replace('_', '-')}`}>
                            {pasantia.estado.replace('_', ' ').charAt(0).toUpperCase() + pasantia.estado.replace('_', ' ').slice(1)}
                          </span>
                        </p>
                        <p><strong>Inicio:</strong> {pasantia.fecha_inicio ? new Date(pasantia.fecha_inicio).toLocaleDateString('es-ES') : 'No establecida'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data">No hay pasantías recientes.</p>
                )}
              </div>
              <Link to="/pasantias" className="ver-todos">Ver todas las pasantías</Link>
            </div>
          </div>
        </section>
      </main>
      
      <footer className={navActive ? 'nav-active' : ''}></footer>
    </div>
  );
}