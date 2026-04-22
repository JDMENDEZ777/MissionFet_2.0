import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './EstudianteSeminario.css';

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
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

// ─────────────────────────────────────────────────────────────
// Componente principal: EstudianteSeminario
// ─────────────────────────────────────────────────────────────
export default function EstudianteSeminario() {
  const navigate = useNavigate();

  const seminarioId = localStorage.getItem('seminario_id') || 1;
  const userName    = localStorage.getItem('user_name') || 'Estudiante';
  const userAvatar  = localStorage.getItem('user_avatar') || 'https://randomuser.me/api/portraits/men/32.jpg';

  const [seccion, setSeccion] = useState('inicio');
  const [filtro, setFiltro]   = useState('pendientes');
  const [loading, setLoading] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [notifAbierto, setNotifAbierto] = useState(false);

  const [stats, setStats]              = useState(null);
  const [proximaClase, setProximaClase]= useState(null);
  const [actividades, setActividades]  = useState([]);
  const [clases, setClases]            = useState([]);
  const [materiales, setMateriales]    = useState([]);

  // Variables calculadas (simulando backend de progreso)
  const promedio = isNaN(parseFloat(stats?.promedio)) ? 0 : parseFloat(stats?.promedio);
  const porcentajeProgreso = Math.round(promedio * 20); // de 0-5 a 0-100%
  const actividadesCalificadas = stats?.calificadas || 0;
  const totalActividades = actividades.length > 0 ? (actividades.length + actividadesCalificadas) : 4; // Mock

  const [modalEntrega, setModalEntrega] = useState(null);
  const [formEntrega, setFormEntrega]   = useState({ comentario: '', archivos: [] });
  const [videoUrl, setVideoUrl]         = useState(null);
  const [filtroFecha, setFiltroFecha]   = useState('recientes');
  const [categoriaMat, setCategoriaMat] = useState('todo');
  const [enviando, setEnviando]         = useState(false);

  const cargarDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/estudiante/seminarios/${seminarioId}/dashboard`);
      setStats(data.stats);
      setProximaClase(data.proxima_clase);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [seminarioId]);

  const cargarActividades = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/estudiante/seminarios/${seminarioId}/actividades?filtro=${filtro}`);
      setActividades(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [seminarioId, filtro]);

  const cargarClases = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/estudiante/seminarios/${seminarioId}/clases`);
      setClases(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [seminarioId]);

  const cargarMateriales = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/estudiante/seminarios/${seminarioId}/materiales`);
      setMateriales(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [seminarioId]);

  useEffect(() => {
    if (seccion === 'inicio')    cargarDashboard();
    else if (seccion === 'actividades') cargarActividades();
    else if (seccion === 'clases')    cargarClases();
    else if (seccion === 'materiales') cargarMateriales();
  }, [seccion, filtro, cargarDashboard, cargarActividades, cargarClases, cargarMateriales]);

  const submitEntrega = async (e) => {
    e.preventDefault();
    setEnviando(true);
    const fd = new FormData();
    fd.append('comentario', formEntrega.comentario);
    formEntrega.archivos.forEach((f) => fd.append('archivos[]', f));
    try {
      await api.post(`/estudiante/seminarios/${seminarioId}/actividades/${modalEntrega.id}/entregar`, fd);
      alert('¡Entregada correctamente!');
      setModalEntrega(null);
      setFormEntrega({ comentario: '', archivos: [] });
      if (seccion === 'actividades') cargarActividades();
      else cargarDashboard();
    } catch (err) {
      alert('Error en la entrega.');
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
                <a style={{ display: 'block', padding: '12px 16px', color: '#343a40', textDecoration: 'none', borderBottom: '1px solid #eee' }}><i className="fas fa-upload"></i> Cambiar avatar</a>
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
                <span>{actividadesCalificadas} de {totalActividades} actividades calificadas</span>
                <a onClick={() => setSeccion('actividades')} style={{cursor: 'pointer'}}>Ver detalles</a>
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
                              <span><i className="far fa-clock"></i> {act.hora_limite?.slice(0,5) || '23:59'}</span>
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
                  [proximaClase].filter(Boolean).concat(clases).slice(0,3).map((clase, idx) => (
                    <div className="next-class" key={idx}>
                      <div className="class-header">
                        <h5 className="class-title">{clase.titulo}</h5>
                        <span className="class-date">{formatearFechaStr(clase.fecha)}</span>
                      </div>
                      <div className="class-info">
                        <span className="class-platform"><i className="fas fa-video"></i> {clase.plataforma}</span>
                        <span className="class-time"><i className="far fa-clock"></i> {clase.hora?.slice(0,5)} ({clase.duracion} min)</span>
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
                  <a onClick={() => setCategoriaMat('todo')}  className={`category-btn ${categoriaMat === 'todo' ? 'active' : ''}`}>
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

            {((seccion === 'clases' && clases.length === 0) || (seccion === 'materiales' && materiales.length === 0)) ? (
               <div className="empty-state">
                  <i className={seccion === 'clases' ? "fas fa-video-slash" : "fas fa-book"}></i>
                  <h3>No hay {seccion === 'clases' ? 'grabaciones' : 'materiales'} disponibles</h3>
                  <p>Aún no se han publicado {seccion === 'clases' ? 'grabaciones de clases' : 'materiales en esta categoría'}.</p>
               </div>
            ) : (
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
                                <span><i className="far fa-clock"></i> {act.hora_limite?.slice(0,5)}</span>
                                <span style={{marginLeft: 10, fontWeight: 'bold'}}>{act.puntaje} Pts</span>
                              </div>
                            </div>
                            {!act.mi_entrega && <a className="btn btn-sm btn-primary" style={{color: 'white'}} onClick={() => setModalEntrega(act)}>Entregar</a>}
                            {act.mi_entrega && <span className={`activity-status ${act.mi_entrega.estado === 'pendiente' ? 'status-submitted' : 'status-graded'}`}>{act.mi_entrega.estado === 'pendiente' ? 'Entregada' : `Calificada: ${act.mi_entrega.calificacion}`}</span>}
                          </li>
                        )) : (
                          <div className="empty-state" style={{ boxShadow: 'none' }}>
                            {filtro === 'pendientes' && (
                              <>
                                <i className="fas fa-check-circle" style={{color: '#28a745'}}></i>
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
                    <div className="recordings-grid">
                      {clases.map(clase => {
                        const videoId = clase.enlace.includes('youtube.com') || clase.enlace.includes('youtu.be') 
                          ? clase.enlace.split('v=')[1]?.split('&')[0] || clase.enlace.split('/').pop()
                          : null;
                        const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '/IMG/video-placeholder.jpg';
                        
                        return (
                          <div className="recording-card" key={clase.id}>
                            <div className="video-thumbnail" onClick={() => setVideoUrl(clase.enlace)}>
                              <img src={thumbnail} alt={clase.titulo} className="thumbnail-img" />
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

                  {seccion === 'materiales' && (
                    <div className="recordings-grid">
                      {categoriaMat === 'todo' && materiales.map(mat => {
                        const randomImg = `https://images.unsplash.com/photo-${1555066931 + Math.floor(Math.random() * 1000)}-?w=400&q=80`;
                        return (
                          <div className="recording-card" key={mat.id}>
                            <div className="video-thumbnail" style={{height: 160}}>
                              <img src={mat.imagen || randomImg} alt={mat.titulo} className="thumbnail-img" />
                              {mat.tipo && <span className="material-type-badge"><i className="fas fa-tag"></i> {mat.tipo}</span>}
                            </div>
                            <div className="recording-info">
                              <h3 className="recording-title">{mat.titulo}</h3>
                              <div className="recording-meta" style={{marginBottom: 15}}>
                                <span><i className="far fa-calendar"></i> {formatearFechaCorta(mat.fecha_subida || new Date())}</span>
                                {mat.plataforma && <span><i className="fas fa-globe"></i> {mat.plataforma}</span>}
                              </div>
                              <p className="material-description" style={{fontSize: '0.85rem', color: '#6c757d', marginBottom: 15, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
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
                          <div className="video-thumbnail" style={{height: 160}}>
                            <img src={`https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&q=80`} alt={doc.title} className="thumbnail-img" />
                            <span className="material-type-badge"><i className="fas fa-file-pdf"></i> {doc.type}</span>
                          </div>
                          <div className="recording-info">
                             <h3 className="recording-title">{doc.title}</h3>
                             <div className="recording-meta" style={{marginBottom: 15}}>
                                <span><i className="fas fa-weight-hanging"></i> {doc.size}</span>
                             </div>
                             <a href={doc.link} className="material-button"><i className="fas fa-download"></i> Descargar</a>
                          </div>
                        </div>
                      ))}

                      {categoriaMat === 'tools' && [
                          { name: 'Visual Studio Code', description: 'Editor de código potente y ligero', link: 'https://code.visualstudio.com/download', img: '1555066931' },
                          { name: 'XAMPP', description: 'Servidor local para PHP y MySQL', link: 'https://www.apachefriends.org/download.html', img: '1498050108' },
                          { name: 'Node.js', description: 'Entorno de ejecución para JavaScript', link: 'https://nodejs.org/download', img: '1504639725' }
                      ].map((tool, idx) => (
                        <div className="recording-card" key={idx}>
                          <div className="video-thumbnail" style={{height: 160}}>
                            <img src={`https://images.unsplash.com/photo-${tool.img}?w=400&q=80`} alt={tool.name} className="thumbnail-img" />
                            <span className="material-type-badge"><i className="fas fa-tools"></i> Herramientas</span>
                          </div>
                          <div className="recording-info">
                             <h3 className="recording-title">{tool.name}</h3>
                             <p className="material-description" style={{fontSize: '0.85rem'}}>{tool.description}</p>
                             <a href={tool.link} className="material-button" target="_blank" rel="noreferrer"><i className="fas fa-download"></i> Descargar</a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
            )}
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

      {/* ─── MODAL ENTREGA ──────────────────────────────────── */}
      {modalEntrega && (
        <div className="modal-overlay" onClick={() => setModalEntrega(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h2 className="card-title">Entregar Actividad</h2>
            </div>
            <form onSubmit={submitEntrega} style={{ marginTop: 20 }}>
              <p><strong>{modalEntrega.titulo}</strong></p>
              <div className="form-group">
                <label>Comentario (opcional)</label>
                <textarea rows="3" value={formEntrega.comentario} onChange={e => setFormEntrega({...formEntrega, comentario: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Archivos adjuntos</label>
                <input type="file" multiple onChange={e => setFormEntrega({...formEntrega, archivos: Array.from(e.target.files)})} />
              </div>
              <div style={{ textAlign: 'right', marginTop: 15 }}>
                <button type="button" className="btn btn-outline-primary" style={{ marginRight: 10 }} onClick={() => setModalEntrega(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={enviando}>{enviando ? 'Enviando...' : 'Entregar'}</button>
              </div>
            </form>
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
            <div className="video-wrapper" style={{height: '100%'}}>
              <iframe
                src={videoUrl.replace('watch?v=', 'embed/')}
                title="Clase Video"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
