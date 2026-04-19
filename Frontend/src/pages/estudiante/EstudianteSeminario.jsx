import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './EstudianteSeminario.css';

// ─────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────

const iconoTipo = (tipo) => ({
  tarea: 'fa-clipboard-list', proyecto: 'fa-diagram-project',
  examen: 'fa-file-alt', cuestionario: 'fa-question-circle',
  investigacion: 'fa-search',
}[tipo] || 'fa-tasks');

const formatFecha = (dateStr) => {
  if (!dateStr) return '—';
  const fecha = new Date(dateStr);
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${dias[fecha.getDay()]}, ${fecha.getDate()} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()}`;
};

// ─────────────────────────────────────────────────────────────
// Componente principal: EstudianteSeminario
// ─────────────────────────────────────────────────────────────

export default function EstudianteSeminario() {
  const navigate = useNavigate();

  const seminarioId = localStorage.getItem('seminario_id') || 1;
  const userName    = localStorage.getItem('user_name') || 'Estudiante';
  const userAvatar  = localStorage.getItem('user_avatar') || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

  // ── Estado ────────────────────────────────────────────────
  const [seccion, setSeccion] = useState('inicio');
  const [filtro, setFiltro]   = useState('pendientes');
  const [loading, setLoading] = useState(false);

  const [stats, setStats]              = useState(null);
  const [proximaClase, setProximaClase]= useState(null);
  const [actividades, setActividades]  = useState([]);
  const [clases, setClases]            = useState([]);
  const [materiales, setMateriales]    = useState([]);

  // Modal de entrega
  const [modalEntrega, setModalEntrega]   = useState(null);
  const [formEntrega, setFormEntrega]     = useState({ comentario: '', archivos: [] });
  const [enviando, setEnviando]           = useState(false);

  // ── Carga de datos ────────────────────────────────────────
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
      alert('¡Actividad entregada exitosamente!');
      setModalEntrega(null);
      setFormEntrega({ comentario: '', archivos: [] });
      if (seccion === 'actividades') cargarActividades();
      else cargarDashboard();
    } catch (err) {
      alert('Error al enviar la entrega.');
    } finally { setEnviando(false); }
  };

  const cerrarSesion = () => { localStorage.clear(); navigate('/login'); };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="student-dashboard-body">

      {/* ─── HEADER ( NAVBAR ) ─────────────────────────────── */}
      <header className="header">
        <div className="logo-container">
          <img src="/IMG/logofet.png" alt="FET" />
          <h2>Seminario — FET</h2>
        </div>

        <nav className="nav-links">
          <a href="#" className={seccion === 'inicio' ? 'active' : ''} onClick={() => setSeccion('inicio')}>Inicio</a>
          <a href="#" className={seccion === 'actividades' ? 'active' : ''} onClick={() => setSeccion('actividades')}>Actividades</a>
          <a href="#" className={seccion === 'clases' ? 'active' : ''} onClick={() => setSeccion('clases')}>Aula Virtual</a>
          <a href="#" className={seccion === 'materiales' ? 'active' : ''} onClick={() => setSeccion('materiales')}>Material</a>
        </nav>

        <div className="header-user">
          <span className="user-name-badge">{userName}</span>
          <button className="logout-btn-header" onClick={cerrarSesion}>Salir</button>
        </div>
      </header>

      {/* ─── MAIN CONTENT ───────────────────────────────────── */}
      <main className="main-content">

        {/* Bienvenida */}
        <section className="welcome-section">
          <div className="welcome-header">
            <h1 className="welcome-title">Bienvenido, <span>{userName.split(' ')[0]}</span></h1>
            <span className="welcome-date">{formatFecha(new Date())}</span>
          </div>
          <p className="welcome-msg">Tienes el control de tus seminarios y actividades desde aquí.</p>
        </section>

        {/* ── SECCIÓN: INICIO ────────────────────────────────── */}
        {seccion === 'inicio' && (
          <>
            <div className="dashboard-grid">
              
              {/* Actividades Pendientes Card */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3 className="card-title">Actividades Pendientes</h3>
                  <div className="card-icon"><i className="fas fa-tasks"></i></div>
                </div>
                <div className="activity-list">
                  {actividades.length > 0 ? (
                    actividades.slice(0, 4).map(act => (
                      <div key={act.id} className="activity-item">
                        <div className="activity-icon-sm"><i className={`fas ${iconoTipo(act.tipo)}`}></i></div>
                        <div className="activity-info">
                          <div className="activity-title">{act.titulo}</div>
                          <div className="activity-meta">
                             <span><i className="fas fa-calendar"></i> {act.fecha_limite}</span>
                          </div>
                        </div>
                        <button className="btn-deliver" onClick={() => { setSeccion('actividades'); setModalEntrega(act); }}>Entregar</button>
                      </div>
                    ))
                  ) : (
                    <p className="empty-data">No tienes actividades pendientes.</p>
                  )}
                </div>
                <a href="#" className="view-all" onClick={() => setSeccion('actividades')}>Ver todas las actividades</a>
              </div>

              {/* Progreso del Seminario Card */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3 className="card-title">Tu Progreso</h3>
                  <div className="card-icon"><i className="fas fa-chart-line"></i></div>
                </div>
                <div className="progress-section">
                   <div className="progress-info">
                      <span>Completado</span>
                      <span>{stats?.promedio ? (stats.promedio * 20).toFixed(0) : 0}%</span>
                   </div>
                   <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${stats?.promedio ? stats.promedio * 20 : 0}%` }}></div>
                   </div>
                   <p className="progress-text">Basado en tus actividades calificadas hasta hoy.</p>
                </div>
                <div className="activity-list" style={{ marginTop: '20px' }}>
                   <div className="activity-item">
                      <div className="activity-icon-sm"><i className="fas fa-check-circle"></i></div>
                      <div className="activity-info">
                         <div className="activity-title">Promedio General</div>
                         <div className="activity-meta">{stats?.promedio || 0} / 5.0</div>
                      </div>
                   </div>
                </div>
              </div>

            </div>
          </>
        )}

        {/* ── OTRAS SECCIONES ────────────────────────────────── */}
        {seccion !== 'inicio' && (
          <div className="dashboard-card" style={{ minHeight: '400px' }}>
            <div className="card-header">
              <h3 className="card-title">
                 {seccion === 'actividades' ? 'Mis Actividades' : seccion === 'clases' ? 'Clases Virtuales' : 'Material de Apoyo'}
              </h3>
            </div>
            <div className="activity-list">
              {loading ? <p className="empty-data">Cargando...</p> : (
                <>
                  {seccion === 'actividades' && actividades.map(act => (
                    <div key={act.id} className="activity-item">
                      <div className="activity-icon-sm"><i className={`fas ${iconoTipo(act.tipo)}`}></i></div>
                      <div className="activity-info">
                        <div className="activity-title">{act.titulo}</div>
                        <div className="activity-meta">
                           <span><i className="fas fa-calendar"></i> Límite: {act.fecha_limite}</span>
                           <span><i className="fas fa-star"></i> {act.puntaje} pts</span>
                        </div>
                      </div>
                      {!act.mi_entrega && <button className="btn-deliver" onClick={() => setModalEntrega(act)}>Entregar</button>}
                      {act.mi_entrega && <span style={{ color: 'var(--primary)', fontWeight: 600 }}>✓ Entregada</span>}
                    </div>
                  ))}
                  {seccion === 'clases' && clases.map(cl => (
                    <div key={cl.id} className="activity-item">
                      <div className="activity-icon-sm"><i className="fas fa-video"></i></div>
                      <div className="activity-info">
                        <div className="activity-title">{cl.titulo}</div>
                        <div className="activity-meta">
                           <span><i className="fas fa-calendar"></i> {cl.fecha} — {cl.hora}</span>
                        </div>
                      </div>
                      <a href={cl.enlace} target="_blank" rel="noreferrer" className="btn-deliver">Unirse</a>
                    </div>
                  ))}
                  {seccion === 'materiales' && materiales.map(mat => (
                    <div key={mat.id} className="activity-item">
                      <div className="activity-icon-sm"><i className="fas fa-book"></i></div>
                      <div className="activity-info">
                        <div className="activity-title">{mat.titulo}</div>
                        <div className="activity-meta">{mat.tipo.toUpperCase()}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ═══ MODAL: Entregar Actividad ════════════════════════ */}
      {modalEntrega && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2><i className="fas fa-cloud-upload-alt"></i> Entregar Actividad</h2>
              <button className="modal-close" onClick={() => setModalEntrega(null)}>&times;</button>
            </div>
            <form onSubmit={submitEntrega}>
              <div className="modal-body">
                <p><strong>Actividad:</strong> {modalEntrega.titulo}</p>
                <div className="form-group">
                  <label>Comentarios</label>
                  <textarea rows="3" value={formEntrega.comentario} onChange={e => setFormEntrega({...formEntrega, comentario: e.target.value})}></textarea>
                </div>
                <div className="form-group">
                  <label>Archivos</label>
                  <input type="file" multiple onChange={e => setFormEntrega({...formEntrega, archivos: Array.from(e.target.files)})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setModalEntrega(null)}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={enviando}>
                   {enviando ? 'Subiendo...' : 'Enviar Actividad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
