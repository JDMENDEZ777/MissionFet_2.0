import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './Inicio_Admin.css';

export default function InicioAdmin() {
  const navigate = useNavigate();
  const [navActive, setNavActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/admin/dashboard');
        const data = response.data;

        setDashboardData({
          nombreUsuario: data.nombreUsuario ?? 'Administrador',
          usuariosPendientesCount: data.usuariosPendientesCount ?? 0,
          totalEstudiantes: data.totalEstudiantes ?? 0,
          totalProyectos: data.totalProyectos ?? 0,
          totalPasantias: data.totalPasantias ?? 0,
          totalSeminarios: data.totalSeminarios ?? 0,
          proyectosRecientes: Array.isArray(data.proyectosRecientes) ? data.proyectosRecientes : [],
          seminariosRecientes: Array.isArray(data.seminariosRecientes) ? data.seminariosRecientes : [],
          pasantiasRecientes: Array.isArray(data.pasantiasRecientes) ? data.pasantiasRecientes : [],
        });
      } catch (err) {
        console.error("Error al cargar los datos del dashboard:", err);
        setError("No se pudo conectar con el servidor. Verifica que el backend esté activo.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const toggleNav = () => setNavActive(!navActive);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Función segura para obtener clase de badge según estado
  const getBadgeClass = (estado) => {
    if (!estado) return 'ia-badge';
    const estadoNorm = estado.replace(/_/g, '-').toLowerCase();
    return `ia-badge ia-estado-${estadoNorm}`;
  };

  // Función segura para capitalizar estado
  const capitalizarEstado = (estado) => {
    if (!estado) return 'Desconocido';
    return estado.replace(/_/g, ' ').charAt(0).toUpperCase() + estado.replace(/_/g, ' ').slice(1);
  };

  // Función segura para formatear fechas
  const formatFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    try {
      return new Date(fecha).toLocaleDateString('es-ES');
    } catch {
      return 'Fecha inválida';
    }
  };

  return (
    // CLASE PADRE ÚNICA: .modulo-inicio-admin - encapsula todo el CSS
    <div className="modulo-inicio-admin">

      {/* LOGO FLOTANTE */}
      <div id="logo" onClick={toggleNav}>
        <img src="/IMG/logofet.png" alt="Logo FET" className="logo-img" />
      </div>

      {/* NAVBAR LATERAL */}
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

      {/* CONTENIDO PRINCIPAL */}
      <main className={navActive ? 'nav-active' : ''}>
        <h1>Panel de Administración</h1>

        {/* ESTADO DE CARGA */}
        {loading && <p className="ia-loading">⏳ Cargando datos del panel...</p>}

        {/* ERROR DE CONEXIÓN */}
        {error && !loading && (
          <div className="ia-dashboard-section" style={{ borderLeft: '5px solid #DC2626', color: '#B91C1C' }}>
            <strong>⚠️ Error:</strong> {error}
          </div>
        )}

        {/* CONTENIDO CUANDO YA CARGÓ */}
        {!loading && !error && (
          <>
            {/* RESUMEN GENERAL */}
            <section className="ia-dashboard-section">
              <h2>Resumen General</h2>
              <div className="ia-dashboard-cards">
                <div className="ia-dashboard-card">
                  <div className="ia-card-icon">👨‍🎓</div>
                  <div className="ia-card-title">Estudiantes Activos</div>
                  <div className="ia-card-value">{dashboardData.totalEstudiantes}</div>
                </div>
                <div className="ia-dashboard-card">
                  <div className="ia-card-icon">📁</div>
                  <div className="ia-card-title">Proyectos</div>
                  <div className="ia-card-value">{dashboardData.totalProyectos}</div>
                </div>
                <div className="ia-dashboard-card">
                  <div className="ia-card-icon">🧪</div>
                  <div className="ia-card-title">Pasantías</div>
                  <div className="ia-card-value">{dashboardData.totalPasantias}</div>
                </div>
                <div className="ia-dashboard-card">
                  <div className="ia-card-icon">📚</div>
                  <div className="ia-card-title">Seminarios</div>
                  <div className="ia-card-value">{dashboardData.totalSeminarios}</div>
                </div>
              </div>
            </section>

            {/* USUARIOS PENDIENTES */}
            <section className="ia-dashboard-section">
              <h2>Usuarios Pendientes de Aprobación</h2>
              <div className="ia-aprobaciones-card">
                <div className="ia-aprobaciones-icon">🔔</div>
                <div className="ia-aprobaciones-info">
                  <p>{dashboardData.usuariosPendientesCount} solicitudes pendientes de aprobación</p>
                  <Link to="/aprobacion" className="ia-btn-primary">Revisar Solicitudes</Link>
                </div>
              </div>
            </section>

            {/* ACCESOS RÁPIDOS */}
            <section className="ia-dashboard-section">
              <h2>Accesos Rápidos</h2>
              <div className="ia-accesos-container">
                <div className="ia-acceso-card">
                  <div className="ia-acceso-header">
                    <h3>Proyectos</h3>
                    <div className="ia-acceso-icon">📁</div>
                  </div>
                  <div className="ia-acceso-body">
                    <p>Gestione los proyectos de grado, asigne tutores y realice seguimiento.</p>
                    <Link to="/proyectos" className="ia-btn-primary">Ir a Proyectos</Link>
                  </div>
                </div>
                <div className="ia-acceso-card">
                  <div className="ia-acceso-header">
                    <h3>Seminarios</h3>
                    <div className="ia-acceso-icon">📚</div>
                  </div>
                  <div className="ia-acceso-body">
                    <p>Administre los seminarios, inscripciones y calificaciones.</p>
                    <Link to="/seminarios" className="ia-btn-primary">Ir a Seminarios</Link>
                  </div>
                </div>
                <div className="ia-acceso-card">
                  <div className="ia-acceso-header">
                    <h3>Pasantías</h3>
                    <div className="ia-acceso-icon">🧪</div>
                  </div>
                  <div className="ia-acceso-body">
                    <p>Gestione las pasantías, empresas y seguimiento de estudiantes.</p>
                    <Link to="/pasantias" className="ia-btn-primary">Ir a Pasantías</Link>
                  </div>
                </div>
              </div>
            </section>

            {/* ELEMENTOS RECIENTES */}
            <section className="ia-dashboard-section">
              <h2>Elementos Recientes</h2>
              <div className="ia-recientes-container">

                {/* PROYECTOS RECIENTES */}
                <div className="ia-recientes-card">
                  <h3>Proyectos Recientes</h3>
                  <div className="ia-recientes-list">
                    {dashboardData.proyectosRecientes.length > 0 ? (
                      dashboardData.proyectosRecientes.map((proyecto, index) => (
                        <div className="ia-reciente-item" key={index}>
                          <div className="ia-reciente-info">
                            <h4>{proyecto.titulo ?? 'Sin título'}</h4>
                            <p><strong>Tutor:</strong> {proyecto.tutor_nombre ?? 'No asignado'}</p>
                            <p><strong>Estado:</strong>{' '}
                              <span className={getBadgeClass(proyecto.estado)}>
                                {capitalizarEstado(proyecto.estado)}
                              </span>
                            </p>
                            <p><strong>Fecha:</strong> {formatFecha(proyecto.fecha_creacion)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="ia-no-data">No hay proyectos recientes.</p>
                    )}
                  </div>
                  <Link to="/proyectos" className="ia-ver-todos">Ver todos los proyectos →</Link>
                </div>

                {/* SEMINARIOS RECIENTES */}
                <div className="ia-recientes-card">
                  <h3>Seminarios Recientes</h3>
                  <div className="ia-recientes-list">
                    {dashboardData.seminariosRecientes.length > 0 ? (
                      dashboardData.seminariosRecientes.map((seminario, index) => (
                        <div className="ia-reciente-item" key={index}>
                          <div className="ia-reciente-info">
                            <h4>{seminario.titulo ?? 'Sin título'}</h4>
                            <p><strong>Tutor:</strong> {seminario.tutor_nombre ?? 'No asignado'}</p>
                            <p><strong>Estado:</strong>{' '}
                              <span className={getBadgeClass(seminario.estado)}>
                                {capitalizarEstado(seminario.estado)}
                              </span>
                            </p>
                            <p><strong>Fecha:</strong> {formatFecha(seminario.fecha)}</p>
                            <p><strong>Inscritos:</strong> {seminario.num_inscritos ?? 0}/{seminario.cupos ?? 0}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="ia-no-data">No hay seminarios recientes.</p>
                    )}
                  </div>
                  <Link to="/seminarios" className="ia-ver-todos">Ver todos los seminarios →</Link>
                </div>

                {/* PASANTÍAS RECIENTES */}
                <div className="ia-recientes-card">
                  <h3>Pasantías Recientes</h3>
                  <div className="ia-recientes-list">
                    {dashboardData.pasantiasRecientes.length > 0 ? (
                      dashboardData.pasantiasRecientes.map((pasantia, index) => (
                        <div className="ia-reciente-item" key={index}>
                          <div className="ia-reciente-info">
                            <h4>{pasantia.titulo ?? 'Sin título'}</h4>
                            <p><strong>Estudiante:</strong> {pasantia.estudiante_nombre ?? 'No asignado'}</p>
                            <p><strong>Empresa:</strong> {pasantia.empresa ?? 'N/A'}</p>
                            <p><strong>Estado:</strong>{' '}
                              <span className={getBadgeClass(pasantia.estado)}>
                                {capitalizarEstado(pasantia.estado)}
                              </span>
                            </p>
                            <p><strong>Inicio:</strong> {formatFecha(pasantia.fecha_inicio)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="ia-no-data">No hay pasantías recientes.</p>
                    )}
                  </div>
                  <Link to="/pasantias" className="ia-ver-todos">Ver todas las pasantías →</Link>
                </div>

              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}