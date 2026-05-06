import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './EstudianteSeminario.css';
import AvatarModal from '../../components/AvatarModal';

// ─────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────
const iconoTipo = (tipo) => {
  const map = {
    tarea: 'fa-clipboard-list', proyecto: 'fa-project-diagram',
    examen: 'fa-file-alt', cuestionario: 'fa-question-circle', investigacion: 'fa-search',
  };
  return map[tipo] || 'fa-tasks';
};

const formatearFechaStr = (dateStr) => {
  if (!dateStr) return '—';
  const fecha = new Date(dateStr);
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${dias[fecha.getDay()]}, ${fecha.getDate()} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()}`;
};

const formatearFechaCorta = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

// ─────────────────────────────────────────────────────────────
// Componente principal: EstudianteSeminario
// ─────────────────────────────────────────────────────────────
export default function EstudianteSeminario() {
  const navigate = useNavigate();

  const [seminarioId, setSeminarioId] = useState(localStorage.getItem('seminario_id'));
  const userName = localStorage.getItem('user_name') || 'Estudiante';
  const [userAvatar, setUserAvatar] = useState(localStorage.getItem('user_avatar') || 'https://randomuser.me/api/portraits/men/32.jpg');

  const [seccion, setSeccion] = useState('inicio');
  const [filtro, setFiltro] = useState('pendientes');
  const [loading, setLoading] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [notifAbierto, setNotifAbierto] = useState(false);

  const [stats, setStats] = useState(null);
  const [proximaClase, setProximaClase] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [clases, setClases] = useState([]);
  const [materiales, setMateriales] = useState([]);

  // Variables calculadas (Progreso real basado en estado de tareas)
  const actPendientesCount = stats?.pendientes || 0;
  const actEntregadasCount = stats?.entregadas || 0;
  const actCalificadasCount = stats?.calificadas || 0;
  const totalActividades = actPendientesCount + actEntregadasCount + actCalificadasCount;
  const actividadesCompletadas = actEntregadasCount + actCalificadasCount;
  const porcentajeProgreso = totalActividades === 0 ? 0 : Math.round((actividadesCompletadas / totalActividades) * 100);

  const [modalEntrega, setModalEntrega] = useState(null);
  const [formEntrega, setFormEntrega] = useState({ comentario: '', archivos: [] });
  const [videoUrl, setVideoUrl] = useState(null);
  const [filtroFecha, setFiltroFecha] = useState('recientes');
  const [categoriaMat, setCategoriaMat] = useState('todo');
  const [enviando, setEnviando] = useState(false);
  const [modalAvatar, setModalAvatar] = useState(false);

  const cargarDashboard = useCallback(async () => {
    if (!seminarioId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/estudiante/seminarios/${seminarioId}/dashboard`);
      setStats(data.stats);
      setProximaClase(data.proxima_clase);
    } catch (err) { 
      console.error(err); 
      if (err.response?.status === 404) {
        buscarMiSeminario();
      }
    }
  }, [seminarioId]);

  const buscarMiSeminario = async () => {
    try {
      const { data } = await api.get('/estudiante/mis-seminarios');
      if (data.data && data.data.length > 0) {
        const id = data.data[0].seminario_id;
        localStorage.setItem('seminario_id', id);
        setSeminarioId(id);
      } else {
        alert('No estás inscrito en ningún seminario aún.');
      }
    } catch (err) {
      console.error('Error buscando seminarios:', err);
    }
  };

  const cargarActividades = useCallback(async () => {
    try {
      const { data } = await api.get(`/estudiante/seminarios/${seminarioId}/actividades?filtro=${filtro}`);
      setActividades(data.data || []);
    } catch (err) { console.error(err); }
  }, [seminarioId, filtro]);

  const cargarClases = useCallback(async () => {
    try {
      const { data } = await api.get(`/estudiante/seminarios/${seminarioId}/clases`);
      setClases(data.data || []);
    } catch (err) { console.error(err); }
  }, [seminarioId]);

  const cargarMateriales = useCallback(async () => {
    try {
      const { data } = await api.get(`/estudiante/seminarios/${seminarioId}/materiales`);
      setMateriales(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [seminarioId]);

  useEffect(() => {
    if (!seminarioId) {
      buscarMiSeminario();
      return;
    }

    if (seccion === 'inicio') cargarDashboard();
    else if (seccion === 'actividades') cargarActividades();
    else if (seccion === 'clases') cargarClases();
    else if (seccion === 'materiales') cargarMateriales();
  }, [seccion, filtro, seminarioId, cargarDashboard, cargarActividades, cargarClases, cargarMateriales]);

    const submitEntrega = async (e) => {
    e.preventDefault();
    setEnviando(true);
    const fd = new FormData();
    fd.append('comentario', formEntrega.comentario);
    fd.append('has_files', formEntrega.archivos.length > 0 ? '1' : '0');
    formEntrega.archivos.forEach((f) => fd.append('archivos[]', f));
    try {
      await api.post(`/estudiante/seminarios/${seminarioId}/actividades/${modalEntrega.id}/entregar`, fd);
      alert('¡Entregada correctamente!');
      setModalEntrega(null);
      setFormEntrega({ comentario: '', archivos: [] });
      if (seccion === 'actividades') cargarActividades();
      else cargarDashboard();
    } catch (err) {
      console.error(err);
      const errors = err.response?.data?.errors;
      if (errors) {
        alert('Errores de validación:\n' + Object.values(errors).flat().join('\n'));
      } else {
        alert(err.response?.data?.message || 'Error en la entrega.');
      }
    } finally { setEnviando(false); }
  };

  const cerrarSesion = () => { localStorage.clear(); navigate('/login'); };

  // Cerrar menús al dar clic afuera
  useEffect(() => {
    const closeMenus = () => {
      setNotifAbierto(false);
      setMenuAbierto(false);
    };
    document.addEventListener('click', closeMenus);
    return () => document.removeEventListener('click', closeMenus);
  }, []);

  // Simulación de actividades
  const actPendientes = actividades.filter(a => !a.mi_entrega).slice(0, 5);
  const actEntregadas = actividades.filter(a => !!a.mi_entrega).slice(0, 5);

  return (
    <div className="es-dashboard-wrapper">
      {/* Importamos FontAwesome globalmente solo para esta pantalla si no existe */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css" />

      {/* ─── HEADER ─────────────────────────────────────────── */}
      <header className="header">
        <img src="/IMG/logofet.png" alt="FET Logo" className="logo" />

        <nav className="nav-links">
          <a onClick={() => setSeccion('inicio')} className={seccion === 'inicio' ? 'active' : ''}>Inicio</a>
          <a onClick={() => setSeccion('actividades')} className={seccion === 'actividades' ? 'active' : ''}>Actividades</a>
          <a onClick={() => setSeccion('clases')} className={seccion === 'clases' ? 'active' : ''}>Aula Virtual</a>
          <a onClick={() => setSeccion('materiales')} className={seccion === 'materiales' ? 'active' : ''}>Material de Apoyo</a>
        </nav>

        <div className="user-profile" style={{ position: 'relative' }}>

          <div id="notification-bell" style={{ position: 'relative', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setNotifAbierto(!notifAbierto); setMenuAbierto(false); }}>
            <i className="fas fa-bell notification-icon"></i>
            {stats?.pendientes > 0 && (
              <span id="notification-badge" style={{
                position: 'absolute', top: '-6px', right: '-6px', background: '#dc3545', color: '#fff',
                borderRadius: '50%', fontSize: '0.75rem', width: '20px', height: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '2px solid #fff', zIndex: 2
              }}>{stats.pendientes}</span>
            )}

            {notifAbierto && (
              <div id="notification-panel" style={{
                position: 'absolute', right: 0, top: '35px', background: '#fff', color: '#343a40', minWidth: '280px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)', borderRadius: '8px', zIndex: 10, overflow: 'hidden'
              }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Notificaciones</div>
                {stats?.pendientes > 0 ? (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: '250px', overflowY: 'auto' }}>
                    <li style={{ padding: '12px 16px', borderBottom: '1px solid #f2f2f2' }}>
                      <div style={{ fontSize: '0.97em' }}>Tienes {stats.pendientes} actividades pendientes.</div>
                    </li>
                  </ul>
                ) : (
                  <div style={{ padding: '16px', color: '#888' }}>No tienes notificaciones nuevas.</div>
                )}
              </div>
            )}
          </div>

          <div id="avatar-container" style={{ position: 'relative', marginLeft: '10px', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setMenuAbierto(!menuAbierto); setNotifAbierto(false); }}>
            <img src={userAvatar} alt="Avatar" className="avatar" />

            {menuAbierto && (
              <div id="user-menu" className="user-menu" onClick={e => e.stopPropagation()}>
                <div className="user-menu-header">{userName}</div>
                <a onClick={() => setModalAvatar(true)} style={{ display: 'block', padding: '12px 16px', color: '#343a40', textDecoration: 'none', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                  <i className="fas fa-upload"></i> Cambiar avatar
                </a>
                <button type="button" onClick={cerrarSesion}><i className="fas fa-sign-out-alt"></i> Cerrar sesión</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT ───────────────────────────────────── */}
      <main className="main-content">

        {seccion === 'inicio' && (
          <>
            <section className="welcome-section">
              <div className="welcome-header">
                <h1 className="welcome-title">Bienvenido, {userName}</h1>
                <span className="welcome-date">{formatearFechaStr(new Date())}</span>
              </div>
              <p className="welcome-message">Aquí encontrarás un resumen de tus actividades pendientes y entregas recientes.</p>
            </section>

            {/* Progreso del curso */}
            <section className="course-progress mb-4">
              <div className="progress-header">
                <h2 className="progress-title">Desarrollo Del Seminario</h2>
                <span className="progress-percentage">{porcentajeProgreso}%</span>
              </div>
              <div className="progress">
                <div className="progress-bar" role="progressbar" style={{ width: `${porcentajeProgreso}%` }}></div>
              </div>
              <div className="progress-details">
                <span>{actividadesCompletadas} de {totalActividades} actividades entregadas</span>
                <a onClick={() => setSeccion('actividades')} style={{ cursor: 'pointer' }}>Ver detalles</a>
              </div>
            </section>

            {/* Tarjetas de resumen verticales */}
            <div className="dashboard-cards-vertical">

              {/* Actividades Pendientes */}
              <div className="dashboard-card flex-fill mb-4">
                <div className="card-header">
                  <h2 className="card-title">Actividades Pendientes</h2>
                  <div className="card-icon"><i className="fas fa-tasks"></i></div>
                </div>
                {actividades.length > 0 && actPendientes.length > 0 ? (
                  <>
                    <ul className="activity-list">
                      {actPendientes.map(act => (
                        <li className="activity-item" key={act.id}>
                          <div className="activity-icon"><i className={`fas ${iconoTipo(act.tipo)}`}></i></div>
                          <div className="activity-info">
                            <h3 className="activity-title">{act.titulo}</h3>
                            <div className="activity-meta">
                              <span><i className="far fa-calendar-alt"></i> {formatearFechaCorta(act.fecha_limite)}</span>
                              <span><i className="far fa-clock"></i> {act.hora_limite?.slice(0, 5) || '23:59'}</span>
                            </div>
                          </div>
                          <a onClick={() => { setSeccion('actividades'); setModalEntrega(act); }} className="btn btn-sm btn-outline-primary">Entregar</a>
                        </li>
                      ))}
                    </ul>
                    <a onClick={() => setSeccion('actividades')} className="view-all">Ver todas las actividades pendientes</a>
                  </>
                ) : (
                  <div className="text-center py-4" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <i className="fas fa-check-circle fa-3x mb-3" style={{ color: '#28a745', marginBottom: '1rem', fontSize: '3em' }}></i>
                    <p>¡No tienes actividades pendientes!</p>
                  </div>
                )}
              </div>

              {/* Entregas Recientes */}
              <div className="dashboard-card flex-fill mb-4">
                <div className="card-header">
                  <h2 className="card-title">Entregas Recientes</h2>
                  <div className="card-icon"><i className="fas fa-clipboard-check"></i></div>
                </div>
                {actEntregadas.length > 0 ? (
                  <>
                    <ul className="activity-list">
                      {actEntregadas.map(act => (
                        <li className="activity-item" key={act.mi_entrega.id}>
                          <div className="activity-icon"><i className="fas fa-file-alt"></i></div>
                          <div className="activity-info">
                            <h3 className="activity-title">{act.titulo}</h3>
                            <div className="activity-meta">
                              <span><i className="far fa-calendar-alt"></i> {formatearFechaCorta(act.mi_entrega.created_at)}</span>
                            </div>
                          </div>
                          {act.mi_entrega.estado === 'pendiente' ? (
                            <span className="activity-status status-submitted">Entregado</span>
                          ) : (
                            <span className="activity-status status-graded">Calificado: {act.mi_entrega.calificacion}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <a onClick={() => setSeccion('actividades')} className="view-all">Ver todas mis entregas</a>
                  </>
                ) : (
                  <div className="text-center py-4" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <i className="fas fa-inbox fa-3x text-muted mb-3" style={{ color: '#6c757d', marginBottom: '1rem', fontSize: '3em' }}></i>
                    <p>No has realizado entregas recientemente</p>
                  </div>
                )}
              </div>

              {/* Próximas Clases */}
              <div className="dashboard-card flex-fill mb-4">
                <div className="card-header">
                  <h2 className="card-title">Próximas Clases</h2>
                  <div className="card-icon"><i className="fas fa-chalkboard-teacher"></i></div>
                </div>
                {proximaClase || clases.length > 0 ? (
                  [proximaClase].filter(Boolean).concat(clases).slice(0, 3).map((clase, idx) => (
                    <div className="next-class" key={idx}>
                      <div className="class-header">
                        <h5 className="class-title">{clase.titulo}</h5>
                        <span className="class-date">{formatearFechaStr(clase.fecha)}</span>
                      </div>
                      <div className="class-info">
                        <span className="class-platform"><i className="fas fa-video"></i> {clase.plataforma}</span>
                        <span className="class-time"><i className="far fa-clock"></i> {clase.hora?.slice(0, 5)} ({clase.duracion} min)</span>
                        <span className="class-date"><i className="fas fa-calendar-alt"></i> {formatearFechaCorta(clase.fecha)}</span>
                      </div>
                      <div>
                        <a href={clase.enlace} className="btn btn-sm btn-primary" target="_blank" rel="noreferrer">
                          <i className="fas fa-sign-in-alt mr-1"></i> Unirse a la clase
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <i className="fas fa-chalkboard-teacher fa-3x text-muted mb-3" style={{ color: '#6c757d', marginBottom: '1rem', fontSize: '3em' }}></i>
                    <p>No hay clases programadas próximamente.</p>
                  </div>
                )}
              </div>

            </div>
          </>
        )}

        {/* ─── OTRAS SECCIONES (Actividades, Clases, Materiales) ──────── */}
        {seccion !== 'inicio' && (
          <>
            <h1 className="page-title">
              {seccion === 'actividades' ? 'Gestión de Actividades' : seccion === 'clases' ? 'Grabaciones de Clases' : 'Material de Apoyo'}
            </h1>

            {seccion === 'actividades' && (
              <div className="filter-tabs">
                <a onClick={() => setFiltro('pendientes')} className={`filter-tab ${filtro === 'pendientes' ? 'active' : ''}`}>Pendientes</a>
                <a onClick={() => setFiltro('entregadas')} className={`filter-tab ${filtro === 'entregadas' ? 'active' : ''}`}>Entregadas</a>
                <a onClick={() => setFiltro('calificadas')} className={`filter-tab ${filtro === 'calificadas' ? 'active' : ''}`}>Calificadas</a>
                <a onClick={() => setFiltro('todas')} className={`filter-tab ${filtro === 'todas' ? 'active' : ''}`}>Todas</a>
              </div>
            )}

            {seccion === 'clases' && (
              <div className="filter-container">
                <div className="filter-label">Fecha:</div>
                <div className="filter-buttons">
                  <a onClick={() => setFiltroFecha('recientes')} className={`filter-button ${filtroFecha === 'recientes' ? 'active' : ''}`}>Recientes</a>
                  <a onClick={() => setFiltroFecha('antiguas')} className={`filter-button ${filtroFecha === 'antiguas' ? 'active' : ''}`}>Antiguas</a>
                </div>
              </div>
            )}

            {seccion === 'materiales' && (
              <div className="categories-container">
                <h3>Categoría:</h3>
                <div className="category-buttons">
                  <a onClick={() => setCategoriaMat('todo')} className={`category-btn ${categoriaMat === 'todo' ? 'active' : ''}`}>
                    <i className="fas fa-th-large"></i> Todo
                  </a>
                  <a onClick={() => setCategoriaMat('documentation')} className={`category-btn ${categoriaMat === 'documentation' ? 'active' : ''}`}>
                    <i className="fas fa-file-alt"></i> Documentación
                  </a>
                  <a onClick={() => setCategoriaMat('tools')} className={`category-btn ${categoriaMat === 'tools' ? 'active' : ''}`}>
                    <i className="fas fa-tools"></i> Herramientas
                  </a>
                </div>
              </div>
            )}

            <div className="dashboard-card" style={{ minHeight: '400px' }}>
              {seccion === 'actividades' && (
                <ul className="activity-list">
                  {actividades.length > 0 ? actividades.map(act => (
                    <li className="activity-item" key={act.id}>
                      <div className="activity-icon"><i className={`fas ${iconoTipo(act.tipo)}`}></i></div>
                      <div className="activity-info">
                        <h3 className="activity-title">{act.titulo}</h3>
                        <div className="activity-meta">
                          <span><i className="far fa-calendar-alt"></i> {formatearFechaCorta(act.fecha_limite)}</span>
                          <span><i className="far fa-clock"></i> {act.hora_limite?.slice(0, 5)}</span>
                          <span style={{ marginLeft: 10, fontWeight: 'bold' }}>{act.puntaje} Pts</span>
                        </div>
                      </div>
                      <div className="activity-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                        {act.mi_entrega ? (
                          <span className={`activity-status ${act.mi_entrega.estado === 'pendiente' ? 'status-submitted' : 'status-graded'}`}>
                            {act.mi_entrega.estado === 'pendiente' ? 'Entregada' : `Calificada: ${act.mi_entrega.calificacion}`}
                          </span>
                        ) : null}
                        <button className="btn btn-sm btn-primary" onClick={() => setModalEntrega(act)}>
                          <i className={`fas ${!act.mi_entrega ? 'fa-paper-plane' : 'fa-eye'}`} style={{ marginRight: '5px' }}></i>
                          {!act.mi_entrega ? 'Entregar' : 'Ver Detalles'}
                        </button>
                      </div>
                    </li>
                  )) : (
                    <div className="empty-state" style={{ boxShadow: 'none' }}>
                      {filtro === 'pendientes' && (
                        <>
                          <i className="fas fa-check-circle" style={{ color: '#28a745' }}></i>
                          <h3>No tienes actividades pendientes</h3>
                          <p>¡Felicidades! Has completado todas tus actividades asignadas.</p>
                        </>
                      )}
                      {filtro === 'entregadas' && (
                        <>
                          <i className="fas fa-clipboard-check"></i>
                          <h3>No hay entregas registradas</h3>
                          <p>Aún no has realizado entregas en este seminario.</p>
                        </>
                      )}
                      {(filtro === 'calificadas' || filtro === 'todas') && (
                        <>
                          <i className="fas fa-folder-open"></i>
                          <h3>No hay actividades</h3>
                          <p>No se encontraron actividades en esta categoría.</p>
                        </>
                      )}
                    </div>
                  )}
                </ul>
              )}

              {seccion === 'clases' && (
                <>
                  {clases.filter(c => c.url_grabacion).length === 0 ? (
                    <div className="empty-state" style={{ boxShadow: 'none' }}>
                      <i className="fas fa-video-slash"></i>
                      <h3>No hay grabaciones disponibles</h3>
                      <p>Aún no se han publicado grabaciones de clases para este curso.</p>
                    </div>
                  ) : (
                    <div className="recordings-grid">
                      {clases.filter(c => c.url_grabacion).map(clase => {
                        const videoId = clase.url_grabacion.includes('youtube.com') || clase.url_grabacion.includes('youtu.be')
                          ? clase.url_grabacion.split('v=')[1]?.split('&')[0] || clase.url_grabacion.split('/').pop()
                          : null;
                        const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '/IMG/video-placeholder.jpg';

                        return (
                          <div className="recording-card" key={clase.id}>
                            <div className="video-thumbnail" onClick={() => setVideoUrl(clase.url_grabacion)}>
                              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e9ecef', color: '#6c757d' }}>
                                <i className="fas fa-video fa-3x"></i>
                              </div>
                              <div className="play-button"><i className="fas fa-play"></i></div>
                              <div className="video-duration">{clase.duracion} min</div>
                            </div>
                            <div className="recording-info">
                              <h3 className="recording-title">{clase.titulo}</h3>
                              <div className="recording-meta">
                                <span><i className="far fa-calendar-alt"></i> {formatearFechaCorta(clase.fecha)}</span>
                                <span><i className="fas fa-video"></i> {clase.plataforma}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {seccion === 'materiales' && (
                <>
                  {categoriaMat === 'todo' && materiales.length === 0 && (
                    <div className="empty-state" style={{ boxShadow: 'none' }}>
                      <i className="fas fa-book"></i>
                      <h3>No hay materiales disponibles</h3>
                      <p>Aún no se han publicado materiales en esta categoría.</p>
                    </div>
                  )}
                  <div className="recordings-grid">
                    {categoriaMat === 'todo' && materiales.map(mat => {
                      const randomImg = `https://images.unsplash.com/photo-${1555066931 + Math.floor(Math.random() * 1000)}-?w=400&q=80`;
                      return (
                        <div className="recording-card" key={mat.id}>

                          <div className="recording-info">
                            <h3 className="recording-title">{mat.titulo}</h3>
                            <div className="recording-meta" style={{ marginBottom: 15 }}>
                              <span><i className="far fa-calendar"></i> {formatearFechaCorta(mat.fecha_subida || new Date())}</span>
                              {mat.plataforma && <span><i className="fas fa-globe"></i> {mat.plataforma}</span>}
                            </div>
                            <p className="material-description" style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: 15, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {mat.descripcion || 'Sin descripción disponible.'}
                            </p>
                            <div className="material-actions">
                              {mat.enlace || mat.archivo ? (
                                <a href={mat.enlace || mat.archivo} className="material-button" target="_blank" rel="noreferrer">
                                  <i className={mat.enlace ? "fas fa-external-link-alt" : "fas fa-download"}></i> {mat.enlace ? 'Ver' : 'Descargar'}
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {categoriaMat === 'documentation' && [
                      { title: 'Manual de HTML', size: '2.5MB', type: 'PDF', link: '#' },
                      { title: 'Guía de PHP', size: '3.1MB', type: 'PDF', link: '#' },
                      { title: 'Tutorial de JavaScript', size: '1.8MB', type: 'PDF', link: '#' }
                    ].map((doc, idx) => (
                      <div className="recording-card" key={idx}>

                        <div className="recording-info">
                          <h3 className="recording-title" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{doc.title}</h3>
                          <div className="recording-meta" style={{ marginBottom: 15 }}>
                            <span><i className="fas fa-file-pdf"></i> {doc.type}</span>
                            <span><i className="fas fa-weight-hanging"></i> {doc.size}</span>
                          </div>
                          <a href={doc.link} className="material-button" style={{ padding: '10px 20px' }}><i className="fas fa-download"></i> Descargar</a>
                        </div>
                      </div>
                    ))}

                    {categoriaMat === 'tools' && [
                      { name: 'Visual Studio Code', description: 'Editor de código potente y ligero', link: 'https://code.visualstudio.com/download', img: '1555066931' },
                      { name: 'XAMPP', description: 'Servidor local para PHP y MySQL', link: 'https://www.apachefriends.org/download.html', img: '1498050108' },
                      { name: 'Node.js', description: 'Entorno de ejecución para JavaScript', link: 'https://nodejs.org/download', img: '1504639725' }
                    ].map((tool, idx) => (
                      <div className="recording-card" key={idx}>

                        <div className="recording-info">
                          <h3 className="recording-title" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{tool.name}</h3>
                          <p className="material-description" style={{ fontSize: '0.85rem', marginBottom: 15 }}>{tool.description}</p>
                          <a href={tool.link} className="material-button" target="_blank" rel="noreferrer" style={{ padding: '10px 20px' }}><i className="fas fa-download"></i> Descargar</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </main>

      {/* ─── FOOTER ─────────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-info">
            <p>Email: direccion_software@fet.edu.co</p>
            <p>Dirección: Kilómetro 12, via Neiva – Rivera</p>
            <p>Teléfono: 6088674935 – (+57) 3223041567</p>

            <div className="social-links">
              <a href="https://www.facebook.com/YoSoyFet" target="_blank" rel="noreferrer"><i className="fab fa-facebook"></i></a>
              <a href="https://twitter.com/yosoyfet" target="_blank" rel="noreferrer"><i className="fab fa-twitter"></i></a>
              <a href="https://www.instagram.com/fetneiva" target="_blank" rel="noreferrer"><i className="fab fa-instagram"></i></a>
              <a href="https://www.youtube.com/channel/UCv647ftA-d--0F02AqF7eng" target="_blank" rel="noreferrer"><i className="fab fa-youtube"></i></a>
            </div>
          </div>

          <img src="/IMG/logofet.png" alt="FET Logo" className="footer-image" />
        </div>
      </footer>

      {/* ─── MODAL ENTREGA / DETALLES ──────────────────────────────────── */}
      {modalEntrega && (
        <div className="modal-overlay" onClick={() => setModalEntrega(null)} style={{ zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="modal-content" style={{ maxWidth: '1000px', width: '95%', maxHeight: '90vh', overflowY: 'auto', background: '#f4f6f9', padding: '25px', borderRadius: '12px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e9ecef', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#333' }}>
                <i className="fas fa-clipboard-list" style={{ marginRight: '10px', color: '#0056b3' }}></i>
                {modalEntrega.mi_entrega ? 'Detalles de la Entrega' : 'Entregar Actividad'}
              </h2>
              <button onClick={() => setModalEntrega(null)} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#6c757d' }}>&times;</button>
            </div>

            <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap' }}>
              {/* Columna Principal */}
              <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Info Actividad */}
                <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e9ecef' }}>
                  <h4 style={{ color: '#0056b3', borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: 0 }}>
                    <i className="fas fa-info-circle"></i> Información de la Actividad
                  </h4>
                  <h2 style={{ color: '#333', margin: '15px 0' }}>{modalEntrega.titulo}</h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', background: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
                    <div><i className="fas fa-calendar-alt text-muted mr-1"></i> <strong>Fecha límite:</strong> {formatearFechaCorta(modalEntrega.fecha_limite)}</div>
                    <div><i className="fas fa-clock text-muted mr-1"></i> <strong>Hora límite:</strong> {modalEntrega.hora_limite?.slice(0, 5)}</div>
                    <div><i className="fas fa-tag text-muted mr-1"></i> <strong>Tipo:</strong> {modalEntrega.tipo}</div>
                    <div><i className="fas fa-star text-muted mr-1"></i> <strong>Puntaje:</strong> {modalEntrega.puntaje} puntos</div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <h5 style={{ color: '#495057', marginBottom: '10px' }}>Descripción</h5>
                    <div style={{ color: '#555', background: '#f8f9fa', padding: '15px', borderRadius: '6px', whiteSpace: 'pre-line' }}>
                      {modalEntrega.descripcion || 'Sin descripción.'}
                    </div>
                  </div>

                  {modalEntrega.archivos && modalEntrega.archivos.length > 0 && (
                    <div>
                      <h5 style={{ color: '#495057', marginBottom: '10px' }}><i className="fas fa-paperclip"></i> Archivos adjuntos del tutor</h5>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {modalEntrega.archivos.map(archivo => (
                          <li key={archivo.id}>
                            <a href={`http://localhost:8000/storage/${archivo.ruta_archivo}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <i className="fas fa-file-pdf fa-lg"></i> {archivo.nombre_archivo}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Zona de Entrega */}
                <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e9ecef' }}>
                  {!modalEntrega.mi_entrega ? (
                    <form onSubmit={submitEntrega}>
                      <h4 style={{ color: '#0056b3', borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: 0, marginBottom: '20px' }}>
                        <i className="fas fa-upload"></i> Tu Entrega
                      </h4>
                      <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ fontWeight: 'bold' }}>Comentarios (opcional)</label>
                        <textarea className="form-control" rows="4" placeholder="Escribe aquí tus comentarios o dudas sobre la actividad..." value={formEntrega.comentario} onChange={e => setFormEntrega({ ...formEntrega, comentario: e.target.value })} style={{ width: '100%', padding: '15px', borderRadius: '6px', border: '1px solid #ced4da', resize: 'vertical' }}></textarea>
                      </div>
                      <div className="form-group" style={{ marginBottom: '25px' }}>
                        <label style={{ fontWeight: 'bold' }}>Archivos adjuntos</label>
                        <div style={{ border: '2px dashed #0056b3', padding: '30px', textAlign: 'center', borderRadius: '8px', background: '#f8f9fa', cursor: 'pointer', transition: 'all 0.3s' }} onClick={() => document.getElementById('file-upload-estudiante').click()}>
                          <i className="fas fa-cloud-upload-alt fa-3x" style={{ color: '#0056b3', marginBottom: '15px' }}></i>
                          <p style={{ margin: 0, color: '#495057', fontSize: '1.1rem' }}>Haz clic para seleccionar archivos</p>
                          <small style={{ color: '#6c757d' }}>Puedes adjuntar archivos. Tamaño máximo: 10MB.</small>
                          <input type="file" id="file-upload-estudiante" multiple onChange={e => setFormEntrega({ ...formEntrega, archivos: Array.from(e.target.files) })} style={{ display: 'none' }} />
                        </div>
                        {formEntrega.archivos.length > 0 && (
                          <div style={{ marginTop: '15px', background: '#e9ecef', padding: '15px', borderRadius: '6px' }}>
                            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#495057' }}>Archivos seleccionados:</p>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                              {formEntrega.archivos.map((file, i) => (
                                <li key={i} style={{ padding: '5px 0', borderBottom: i !== formEntrega.archivos.length - 1 ? '1px solid #dee2e6' : 'none', color: '#333' }}>
                                  <i className="fas fa-file mr-2" style={{ color: '#0056b3' }}></i> {file.name}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <button type="button" className="btn btn-secondary" style={{ marginRight: '10px', padding: '10px 20px' }} onClick={() => setModalEntrega(null)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={enviando} style={{ padding: '10px 20px' }}>
                          <i className="fas fa-paper-plane mr-2"></i> {enviando ? 'Enviando...' : 'Enviar Entrega'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <h4 style={{ color: '#0056b3', borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: 0, marginBottom: '20px' }}>
                        <i className="fas fa-clipboard-check"></i> Información de la Entrega
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#f8f9fa', borderRadius: '6px' }}>
                          <span style={{ fontWeight: 'bold', color: '#495057' }}>Estado:</span>
                          {modalEntrega.mi_entrega.estado === 'calificado' ? 
                            <span style={{ background: '#28a745', color: 'white', padding: '5px 12px', borderRadius: '20px', fontWeight: 'bold' }}>Calificada</span> : 
                            <span style={{ background: '#ffc107', color: '#333', padding: '5px 12px', borderRadius: '20px', fontWeight: 'bold' }}>Entregada (Pendiente)</span>
                          }
                        </div>
                        
                        <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '6px' }}>
                          <h6 style={{ margin: '0 0 10px 0', color: '#495057' }}>Tu comentario:</h6>
                          <div style={{ color: '#555', fontStyle: modalEntrega.mi_entrega.comentario ? 'normal' : 'italic' }}>
                            {modalEntrega.mi_entrega.comentario || 'No añadiste comentarios a esta entrega.'}
                          </div>
                        </div>

                        {modalEntrega.mi_entrega.estado === 'calificado' && (
                          <div style={{ padding: '20px', background: '#e8f4fd', border: '1px solid #b8daff', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #b8daff', paddingBottom: '10px' }}>
                              <h5 style={{ margin: 0, color: '#0056b3' }}><i className="fas fa-star text-warning mr-2"></i>Calificación Final</h5>
                              <strong style={{ fontSize: '1.4rem', color: '#0056b3' }}>{modalEntrega.mi_entrega.calificacion} / 5.0</strong>
                            </div>
                            <div>
                              <h6 style={{ margin: '0 0 5px 0', color: '#495057' }}>Retroalimentación del Tutor:</h6>
                              <p style={{ margin: 0, color: '#333' }}>{modalEntrega.mi_entrega.comentario_tutor || 'Sin comentarios adicionales.'}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Columna Consejos (Lateral) */}
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e9ecef', position: 'sticky', top: '20px' }}>
                  <h4 style={{ color: '#495057', borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: 0, marginBottom: '20px' }}>
                    <i className="fas fa-lightbulb" style={{ color: '#ffc107', marginRight: '8px' }}></i> Consejos para la entrega
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#555' }}>
                    <li style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                      <i className="fas fa-check-circle mt-1" style={{ color: '#28a745' }}></i> 
                      <span>Asegúrate de leer detenidamente las instrucciones de la actividad.</span>
                    </li>
                    <li style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                      <i className="fas fa-check-circle mt-1" style={{ color: '#28a745' }}></i> 
                      <span>Verifica que los archivos que adjuntes estén en los formatos solicitados.</span>
                    </li>
                    <li style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                      <i className="fas fa-check-circle mt-1" style={{ color: '#28a745' }}></i> 
                      <span>Realiza la entrega con tiempo suficiente antes de la fecha límite.</span>
                    </li>
                    <li style={{ display: 'flex', gap: '10px' }}>
                      <i className="fas fa-check-circle mt-1" style={{ color: '#28a745' }}></i> 
                      <span>Si tienes dudas, puedes incluirlas en el campo de comentarios.</span>
                    </li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ─── VIDEO MODAL ────────────────────────────────────── */}
      {videoUrl && (
        <div className="video-modal" onClick={() => setVideoUrl(null)}>
          <div className="video-container" onClick={e => e.stopPropagation()}>
            <div className="close-button-video" onClick={() => setVideoUrl(null)}>
              <i className="fas fa-times"></i>
            </div>
            <div className="video-wrapper" style={{ height: '100%' }}>
              <iframe
                src={videoUrl.replace('watch?v=', 'embed/')}
                title="Clase Video"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL AVATAR ────────────────────────────────────── */}
      <AvatarModal
        isOpen={modalAvatar}
        onClose={() => setModalAvatar(false)}
        currentAvatar={userAvatar}
        onAvatarUpdate={(newUrl) => setUserAvatar(newUrl)}
      />
    </div>
  );
}
