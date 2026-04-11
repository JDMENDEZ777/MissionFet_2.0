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
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

/** ¿Está la actividad próxima a vencerse? (menos de 2 días) */
const esUrgente = (fechaLimite) => {
  if (!fechaLimite) return false;
  const diff = new Date(fechaLimite) - new Date();
  return diff > 0 && diff < 2 * 24 * 60 * 60 * 1000;
};

// ─────────────────────────────────────────────────────────────
// Componente principal: EstudianteSeminario
// ─────────────────────────────────────────────────────────────

export default function EstudianteSeminario() {
  const navigate = useNavigate();

  const seminarioId = localStorage.getItem('seminario_id') || 1;
  const userName    = localStorage.getItem('user_name') || 'Estudiante';

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
  const [modalEntrega, setModalEntrega]   = useState(null); // actividad seleccionada
  const [formEntrega, setFormEntrega]     = useState({ comentario: '', archivos: [] });
  const [mensajeEntrega, setMensajeEntrega] = useState(null);
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
    if (seccion === 'actividades') cargarActividades();
    if (seccion === 'clases')    cargarClases();
    if (seccion === 'materiales') cargarMateriales();
  }, [seccion, filtro, cargarDashboard, cargarActividades, cargarClases, cargarMateriales]);

  // ── Entregar actividad ────────────────────────────────────
  const submitEntrega = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensajeEntrega(null);
    const fd = new FormData();
    fd.append('comentario', formEntrega.comentario);
    formEntrega.archivos.forEach((f) => fd.append('archivos[]', f));
    try {
      await api.post(
        `/estudiante/seminarios/${seminarioId}/actividades/${modalEntrega.id}/entregar`,
        fd
      );
      setMensajeEntrega({ tipo: 'exito', texto: '¡Actividad entregada exitosamente!' });
      setTimeout(() => {
        setModalEntrega(null);
        setMensajeEntrega(null);
        setFormEntrega({ comentario: '', archivos: [] });
        cargarActividades();
      }, 1800);
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al enviar la entrega.';
      setMensajeEntrega({ tipo: 'error', texto: msg });
    } finally { setEnviando(false); }
  };

  // ── Badge de estado de entrega ────────────────────────────
  const badgeEntrega = (act) => {
    const e = act.mi_entrega;
    if (!e) return <span className="es-badge pending"><i className="fas fa-clock"></i> Pendiente</span>;
    if (e.estado === 'calificado') return <span className="es-badge graded"><i className="fas fa-star"></i> {e.calificacion}/5</span>;
    return <span className="es-badge submitted"><i className="fas fa-check"></i> Entregada</span>;
  };

  // ── Logout ────────────────────────────────────────────────
  const cerrarSesion = () => { localStorage.clear(); navigate('/login'); };

  // ── Fecha de hoy para bienvenida ──────────────────────────
  const hoy = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="es-layout">

      {/* ── Header de navegación ──────────────────────────── */}
      <header className="es-header">
        <div className="es-header-left">
          <img src="/assets/images/logofet.png" alt="FET" className="es-header-logo" />
          <span className="es-header-title">Seminario — FET</span>
        </div>

        <nav className="es-nav">
          {[
            { id: 'inicio',      icon: 'fa-home',     label: 'Inicio' },
            { id: 'actividades', icon: 'fa-tasks',     label: 'Actividades' },
            { id: 'clases',      icon: 'fa-video',     label: 'Clases' },
            { id: 'materiales',  icon: 'fa-book-open', label: 'Material' },
          ].map(({ id, icon, label }) => (
            <button
              key={id}
              className={`es-nav-btn ${seccion === id ? 'active' : ''}`}
              onClick={() => setSeccion(id)}
            >
              <i className={`fas ${icon}`}></i> {label}
            </button>
          ))}
        </nav>

        <div className="es-header-right">
          <div className="es-user-pill"><i className="fas fa-user-graduate"></i> {userName}</div>
          <button className="es-logout-btn" onClick={cerrarSesion}>
            <i className="fas fa-sign-out-alt"></i> Salir
          </button>
        </div>
      </header>

      <main className="es-main">

        {/* ─── INICIO ─────────────────────────────────────── */}
        {seccion === 'inicio' && (
          <>
            <div className="es-welcome">
              <div>
                <h2>¡Hola, {userName.split(' ')[0]}! 👋</h2>
                <p>Bienvenido al panel de tu seminario</p>
              </div>
              <div className="es-welcome-date"><i className="fas fa-calendar"></i> {hoy}</div>
            </div>

            {loading ? <EsSpinner /> : (
              <>
                <div className="es-stats-grid">
                  <EsStatCard icon="fa-clock" color="yellow" value={stats?.pendientes ?? '—'} label="Actividades pendientes" />
                  <EsStatCard icon="fa-check-circle" color="blue" value={stats?.entregadas ?? '—'} label="Entregadas" />
                  <EsStatCard icon="fa-star" color="green" value={stats?.calificadas ?? '—'} label="Calificadas" />
                  <EsStatCard icon="fa-chart-line" color="green" value={stats?.promedio ? `${stats.promedio}/5` : '—'} label="Promedio actual" />
                </div>

                {proximaClase && (
                  <div className="es-next-class">
                    <div className="es-next-class-icon"><i className="fas fa-video"></i></div>
                    <div className="es-next-class-info">
                      <h3>{proximaClase.titulo}</h3>
                      <p><i className="fas fa-calendar"></i> {formatFecha(proximaClase.fecha)} — {proximaClase.hora?.slice(0,5)}</p>
                      <p><i className="fas fa-desktop"></i> {proximaClase.plataforma} · {proximaClase.duracion} min</p>
                    </div>
                    <a href={proximaClase.enlace} target="_blank" rel="noreferrer" className="es-class-join-btn">
                      <i className="fas fa-external-link-alt"></i> Unirse
                    </a>
                  </div>
                )}

                <div className="es-section">
                  <div className="es-section-header">
                    <span className="es-section-title"><i className="fas fa-tasks"></i> Acceso rápido</span>
                  </div>
                  <div className="es-section-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button className="es-btn es-btn-primary" onClick={() => setSeccion('actividades')}>
                      <i className="fas fa-tasks"></i> Ver mis actividades
                    </button>
                    <button className="es-btn es-btn-secondary" onClick={() => setSeccion('materiales')}>
                      <i className="fas fa-book-open"></i> Material de apoyo
                    </button>
                    <button className="es-btn es-btn-secondary" onClick={() => setSeccion('clases')}>
                      <i className="fas fa-video"></i> Próximas clases
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ─── ACTIVIDADES ─────────────────────────────────── */}
        {seccion === 'actividades' && (
          <>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A1A1A', marginBottom: 20 }}>
              <i className="fas fa-tasks" style={{ color: '#039708' }}></i> Mis Actividades
            </h2>

            <div className="es-filter-tabs">
              {['pendientes', 'entregadas', 'calificadas', 'todas'].map((f) => (
                <button key={f} className={`es-filter-tab ${filtro === f ? 'active' : ''}`} onClick={() => setFiltro(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {loading ? <EsSpinner /> : actividades.length === 0 ? (
              <EsEmpty icon="fa-tasks" title="Sin actividades" text="No hay actividades en esta categoría." />
            ) : actividades.map((act) => {
              const urgente = esUrgente(act.fecha_limite);
              const yaEntrego = !!act.mi_entrega;
              return (
                <div key={act.id} className="es-activity-card">
                  <div className="es-activity-card-header">
                    <div className="es-activity-tipo">
                      <i className={`fas ${iconoTipo(act.tipo)}`}></i> {act.tipo}
                    </div>
                    <div className={`es-activity-deadline${urgente ? ' urgent' : ''}`}>
                      {urgente && <i className="fas fa-exclamation-triangle"></i>}
                      <i className="fas fa-calendar"></i> {formatFecha(act.fecha_limite)} — {act.hora_limite?.slice(0,5)}
                    </div>
                  </div>
                  <div className="es-activity-card-body">
                    <div className="es-activity-title">{act.titulo}</div>
                    <div className="es-activity-desc">{act.descripcion || 'Sin descripción.'}</div>

                    {/* Archivos del enunciado */}
                    {act.archivos?.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                        {act.archivos.map((a) => (
                          <a key={a.id} href={`http://localhost:8000/storage/${a.ruta_archivo}`} target="_blank" rel="noreferrer" className="es-file-chip">
                            <i className="fas fa-paperclip"></i> {a.nombre_archivo}
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Resultado si ya fue calificado */}
                    {act.mi_entrega?.estado === 'calificado' && (
                      <div className="es-grade-box">
                        <div>
                          <div className="es-grade-value">{act.mi_entrega.calificacion} <small style={{ fontSize: '1rem' }}>/ {act.puntaje}</small></div>
                          <div className="es-grade-label">Tu calificación</div>
                        </div>
                        {act.mi_entrega.comentario_tutor && (
                          <div style={{ fontSize: '0.88rem', opacity: 0.9 }}>
                            <strong>Retroalimentación:</strong><br />{act.mi_entrega.comentario_tutor}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="es-activity-card-footer">
                    {badgeEntrega(act)}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <small style={{ color: '#6B7280' }}>📊 Puntaje: <strong>{act.puntaje}</strong></small>
                      {!yaEntrego && (
                        <button className="es-btn es-btn-primary" onClick={() => setModalEntrega(act)}>
                          <i className="fas fa-upload"></i> Entregar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ─── CLASES VIRTUALES ────────────────────────────── */}
        {seccion === 'clases' && (
          <>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A1A1A', marginBottom: 20 }}>
              <i className="fas fa-video" style={{ color: '#039708' }}></i> Clases Virtuales
            </h2>

            {loading ? <EsSpinner /> : clases.length === 0 ? (
              <EsEmpty icon="fa-video" title="Sin clases programadas" text="El tutor aún no ha programado clases virtuales." />
            ) : clases.map((c) => (
              <div key={c.id} className="es-activity-card">
                <div className="es-activity-card-header">
                  <div className="es-activity-tipo"><i className="fas fa-video"></i> {c.plataforma}</div>
                  <div className="es-activity-deadline"><i className="fas fa-calendar"></i> {formatFecha(c.fecha)} — {c.hora?.slice(0,5)}</div>
                </div>
                <div className="es-activity-card-body">
                  <div className="es-activity-title">{c.titulo}</div>
                  <div className="es-activity-desc">{c.descripcion || 'Sin descripción.'}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.85rem', color: '#6B7280' }}>
                    <span><i className="fas fa-clock"></i> Duración: {c.duracion} min</span>
                    <span><i className="fas fa-desktop"></i> {c.plataforma}</span>
                  </div>
                </div>
                <div className="es-activity-card-footer">
                  <span></span>
                  <a href={c.enlace} target="_blank" rel="noreferrer" className="es-btn es-btn-primary">
                    <i className="fas fa-external-link-alt"></i> Unirse a la clase
                  </a>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ─── MATERIAL DE APOYO ───────────────────────────── */}
        {seccion === 'materiales' && (
          <>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A1A1A', marginBottom: 20 }}>
              <i className="fas fa-book-open" style={{ color: '#039708' }}></i> Material de Apoyo
            </h2>

            {loading ? <EsSpinner /> : materiales.length === 0 ? (
              <EsEmpty icon="fa-book-open" title="Sin materiales" text="El tutor aún no ha subido materiales de apoyo." />
            ) : materiales.map((m) => (
              <div key={m.id} className="es-material-card">
                <div className="es-material-header">
                  <div className="es-material-icon">
                    <i className={`fas ${m.tipo === 'video' ? 'fa-play-circle' : 'fa-file-alt'}`}></i>
                  </div>
                  <div>
                    <div className="es-material-title">{m.titulo}</div>
                    <div className="es-material-desc">{formatFecha(m.created_at)}</div>
                  </div>
                </div>
                {m.descripcion && (
                  <div style={{ padding: '10px 18px', fontSize: '0.9rem', color: '#6B7280' }}>{m.descripcion}</div>
                )}
                {m.archivos?.length > 0 && (
                  <div className="es-material-files">
                    {m.archivos.map((a) => (
                      <a key={a.id} href={`http://localhost:8000/storage/${a.ruta_archivo}`} target="_blank" rel="noreferrer" className="es-file-chip">
                        <i className="fas fa-download"></i> {a.nombre_archivo}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </main>

      {/* ═══ MODAL: Entregar Actividad ════════════════════════ */}
      {modalEntrega && (
        <div className="es-modal-overlay" onClick={() => setModalEntrega(null)}>
          <div className="es-modal" onClick={(e) => e.stopPropagation()}>
            <div className="es-modal-header">
              <h2><i className="fas fa-upload"></i> Entregar: {modalEntrega.titulo}</h2>
              <button className="es-modal-close" onClick={() => setModalEntrega(null)}>×</button>
            </div>
            <form onSubmit={submitEntrega}>
              <div className="es-modal-body">
                {/* Info de la actividad */}
                <div style={{ background: '#F7FAFC', border: '2px solid #E5E7EB', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: '0.88rem', color: '#6B7280' }}>
                  <strong style={{ color: '#1A1A1A' }}>{modalEntrega.titulo}</strong><br />
                  <span><i className="fas fa-calendar"></i> Límite: {formatFecha(modalEntrega.fecha_limite)} — {modalEntrega.hora_limite?.slice(0,5)}</span>
                  <span style={{ marginLeft: 16 }}><i className="fas fa-star"></i> Puntaje: {modalEntrega.puntaje}</span>
                </div>

                {mensajeEntrega && (
                  <div style={{
                    padding: '12px 16px', borderRadius: 10, marginBottom: 14,
                    background: mensajeEntrega.tipo === 'exito' ? 'rgba(3,151,8,0.1)' : 'rgba(220,38,38,0.1)',
                    color: mensajeEntrega.tipo === 'exito' ? '#027305' : '#DC2626',
                    fontWeight: 600, fontSize: '0.9rem',
                  }}>
                    <i className={`fas ${mensajeEntrega.tipo === 'exito' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i> {mensajeEntrega.texto}
                  </div>
                )}

                <div className="es-form-field">
                  <label>Comentario (opcional)</label>
                  <textarea
                    rows={4} placeholder="Describe tu trabajo, observaciones o dificultades..."
                    value={formEntrega.comentario}
                    onChange={(e) => setFormEntrega({ ...formEntrega, comentario: e.target.value })}
                  />
                </div>
                <div className="es-form-field">
                  <label>Archivos adjuntos</label>
                  <input
                    type="file" multiple
                    onChange={(e) => setFormEntrega({ ...formEntrega, archivos: Array.from(e.target.files) })}
                  />
                  <small style={{ color: '#6B7280', fontSize: '0.8rem' }}>Puedes adjuntar múltiples archivos (máximo 10MB por archivo)</small>
                </div>
              </div>
              <div className="es-modal-footer">
                <button type="button" className="es-btn es-btn-secondary" onClick={() => setModalEntrega(null)}>Cancelar</button>
                <button type="submit" className="es-btn es-btn-primary" disabled={enviando}>
                  {enviando ? <><i className="fas fa-spinner fa-spin"></i> Enviando...</> : <><i className="fas fa-paper-plane"></i> Enviar Entrega</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-componentes
// ─────────────────────────────────────────────────────────────

function EsStatCard({ icon, color, value, label }) {
  return (
    <div className="es-stat-card">
      <div className={`es-stat-icon ${color}`}><i className={`fas ${icon}`}></i></div>
      <div>
        <div className="es-stat-value">{value}</div>
        <div className="es-stat-label">{label}</div>
      </div>
    </div>
  );
}

function EsSpinner() {
  return (
    <div className="es-loading">
      <div className="es-spinner"></div> <span>Cargando...</span>
    </div>
  );
}

function EsEmpty({ icon, title, text }) {
  return (
    <div className="es-empty-state">
      <i className={`fas ${icon}`}></i>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
