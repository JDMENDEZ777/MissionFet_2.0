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
  return `${dias[fecha.getDay()]} ${fecha.getDate()} de ${meses[fecha.getMonth()]}`;
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

  // Fecha de hoy formateada de bienvenida
  const hoyStr = formatearFechaStr(new Date());

  // Dividir actividades en pendientes/entregadas (simulación rápida para Dashboard)
  const actPendientes = actividades.filter(a => !a.mi_entrega).slice(0, 5);
  const actEntregadas = actividades.filter(a => !!a.mi_entrega).slice(0, 5);

  return (
    <div className="es-dashboard-wrapper">
      
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
          <div id="notification-bell" style={{ position: 'relative', cursor: 'pointer' }}>
            <i className="fas fa-bell notification-icon"></i>
            {stats?.pendientes > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6, background: '#dc3545', color: '#fff',
                borderRadius: '50%', fontSize: '0.75rem', width: 20, height: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '2px solid #fff'
              }}>{stats.pendientes}</span>
            )}
          </div>
          
          <div id="avatar-container" style={{ position: 'relative', marginLeft: 10, cursor: 'pointer' }} onClick={() => setMenuAbierto(!menuAbierto)}>
            <img src={userAvatar} alt="Avatar" className="avatar" />
            
            {menuAbierto && (
              <div className="user-menu" onClick={e => e.stopPropagation()}>
                <div className="user-menu-header">{userName}</div>
                <button onClick={cerrarSesion}><i className="fas fa-sign-out-alt"></i> Cerrar sesión</button>
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
                <h1 className="welcome-title">Bienvenido, {userName.split(' ')[0]}</h1>
                <span className="welcome-date">{hoyStr}</span>
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
                {actividades.length > 0 ? (
                  <>
                    <ul className="activity-list">
                      {actPendientes.map(act => (
                        <li className="activity-item" key={act.id}>
                          <div className="activity-icon"><i className={`fas ${iconoTipo(act.tipo)}`}></i></div>
                          <div className="activity-info">
                            <h3 className="activity-title">{act.titulo}</h3>
                            <div className="activity-meta">
                              <span><i className="far fa-calendar-alt"></i> {formatearFechaCorta(act.fecha_limite)}</span>
                              <span><i className="far fa-clock"></i> {act.hora_limite?.slice(0,5)}</span>
                            </div>
                          </div>
                          <button className="btn btn-sm btn-outline-primary" onClick={() => { setSeccion('actividades'); setModalEntrega(act); }}>Entregar</button>
                        </li>
                      ))}
                    </ul>
                    <a onClick={() => setSeccion('actividades')} className="view-all">Ver todas las actividades pendientes</a>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <i className="fas fa-check-circle fa-3x" style={{ color: '#28a745', marginBottom: '1rem' }}></i>
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
                            <span className="activity-status status-submitted" style={{marginRight: 10}}>Entregado</span>
                          ) : (
                            <span className="activity-status status-graded" style={{marginRight: 10}}>Calificado: {act.mi_entrega.calificacion}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <a onClick={() => setSeccion('actividades')} className="view-all">Ver todas mis entregas</a>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <i className="fas fa-inbox fa-3x" style={{ color: '#6c757d', marginBottom: '1rem' }}></i>
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
                  <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <i className="fas fa-chalkboard-teacher fa-3x" style={{ color: '#6c757d', marginBottom: '1rem' }}></i>
                    <p>No hay clases programadas próximamente.</p>
                  </div>
                )}
              </div>

            </div>
          </>
        )}

        {/* ─── OTRAS SECCIONES ─────────────────────────────── */}
        {seccion !== 'inicio' && (
          <div className="dashboard-card" style={{ minHeight: '400px' }}>
            <div className="card-header" style={{ marginBottom: 20 }}>
              <h2 className="card-title">
                {seccion === 'actividades' ? 'Mis Actividades' : seccion === 'clases' ? 'Aula Virtual' : 'Material de Apoyo'}
              </h2>
            </div>
            
            {seccion === 'actividades' && (
               <ul className="activity-list">
                 {actividades.length === 0 ? <p>No hay registros.</p> : actividades.map(act => (
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
                     {!act.mi_entrega && <button className="btn btn-sm btn-primary" onClick={() => setModalEntrega(act)}>Entregar</button>}
                     {act.mi_entrega && <span className={`activity-status ${act.mi_entrega.estado === 'pendiente' ? 'status-submitted' : 'status-graded'}`}>{act.mi_entrega.estado === 'pendiente' ? 'Entregada' : `Calificada: ${act.mi_entrega.calificacion}`}</span>}
                   </li>
                 ))}
               </ul>
            )}

            {seccion === 'clases' && (
               <div>
                  {clases.length === 0 ? <p>No hay clases.</p> : clases.map((clase) => (
                    <div className="next-class" key={clase.id}>
                      <div className="class-header">
                        <h5 className="class-title">{clase.titulo}</h5>
                        <span className="class-date">{formatearFechaStr(clase.fecha)}</span>
                      </div>
                      <div className="class-info">
                        <span className="class-platform"><i className="fas fa-video"></i> {clase.plataforma}</span>
                        <span className="class-time"><i className="far fa-clock"></i> {clase.hora?.slice(0,5)} ({clase.duracion} min)</span>
                      </div>
                      <a href={clase.enlace} className="btn btn-sm btn-primary" target="_blank" rel="noreferrer">Unirse</a>
                    </div>
                  ))}
               </div>
            )}

            {seccion === 'materiales' && (
                <ul className="activity-list">
                 {materiales.length === 0 ? <p>No hay materiales.</p> : materiales.map(mat => (
                   <li className="activity-item" key={mat.id}>
                     <div className="activity-icon"><i className="fas fa-book"></i></div>
                     <div className="activity-info">
                       <h3 className="activity-title">{mat.titulo}</h3>
                       <div className="activity-meta">
                         <span><i className="far fa-file"></i> {mat.tipo.toUpperCase()}</span>
                       </div>
                     </div>
                   </li>
                 ))}
               </ul>
            )}
          </div>
        )}

      </main>
      
      {/* ─── FOOTER ─────────────────────────────────────────── */}
      {seccion === 'inicio' && (
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-info">
              <h3>Seminario FET</h3>
              <p>Módulo de gestión y recursos académicos</p>
            </div>
            <div>
              <img src="/IMG/logofet.png" alt="FET" className="footer-image" style={{ height: 50 }} />
            </div>
          </div>
        </footer>
      )}

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

    </div>
  );
}
