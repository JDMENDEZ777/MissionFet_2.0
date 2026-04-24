import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './TutorSeminario.css';

// ─────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────
const iconoTipo = (tipo) => {
  const m = { tarea:'fa-clipboard-list', proyecto:'fa-diagram-project', examen:'fa-file-alt', cuestionario:'fa-question-circle', investigacion:'fa-search' };
  return m[tipo] || 'fa-file-alt';
};

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const dias  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${dias[d.getDay()]} ${d.getDate()} de ${meses[d.getMonth()]}`;
};

const fmtH = (h) => (h ? h.slice(0,5) : '—');
const fmtD = (d) => (d ? d.slice(0,10).split('-').reverse().join('/') : '—');

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────
export default function TutorSeminario() {
  const navigate = useNavigate();

  const seminarioId = localStorage.getItem('seminario_id') || 1;
  const userName    = localStorage.getItem('user_name') || 'Tutor';

  // Estado
  const [seccion, setSeccion] = useState('inicio');
  const [filtro, setFiltro]   = useState('todas');
  const [loading, setLoading] = useState(false);

  // Datos
  const [stats,          setStats]          = useState(null);
  const [proximaClase,   setProximaClase]   = useState(null);
  const [proximasActivs, setProximasActivs] = useState([]);
  const [actividades,    setActividades]    = useState([]);
  const [clases,         setClases]         = useState([]);
  const [materiales,     setMateriales]     = useState([]);
  const [grabaciones,    setGrabaciones]    = useState([]);

  // Modales
  const [modalActividad, setModalActividad] = useState(false);
  const [modalClase,     setModalClase]     = useState(false);
  const [modalMaterial,  setModalMaterial]  = useState(false);
  const [modalGrabacion, setModalGrabacion] = useState(false);
  const [editando,       setEditando]       = useState(null);

  // Formularios
  const [formActividad, setFormActividad] = useState({ titulo:'', descripcion:'', fecha_limite:'', hora_limite:'23:59', tipo:'tarea', puntaje:5, archivos:[] });
  const [formClase,     setFormClase]     = useState({ titulo:'', descripcion:'', fecha:'', hora:'', duracion:90, plataforma:'Zoom', enlace:'' });
  const [formMaterial,  setFormMaterial]  = useState({ titulo:'', descripcion:'', tipo:'video_links', plataforma:'youtube', enlace:'', thumbnail_url:'', estudiante_id:'', archivos:[] });
  const [formGrabacion, setFormGrabacion] = useState({ clase_id:'', url_grabacion:'', descripcion:'' });

  // Categorías de material
  const [materialCategory, setMaterialCategory] = useState('');
  const [estudiantes, setEstudiantes] = useState([]);

  // ── Carga ─────────────────────────────────────────────────
  const cargarDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/tutor/seminarios/${seminarioId}/dashboard`);
      setStats(data.stats);
      setProximaClase(data.proxima_clase);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [seminarioId]);

  const cargarActividades = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/tutor/seminarios/${seminarioId}/actividades?filtro=${filtro}`);
      const arr = data.data || [];
      setActividades(arr);
      setProximasActivs(arr.slice(0, 3));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [seminarioId, filtro]);

  const cargarClases = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/tutor/seminarios/${seminarioId}/clases`);
      setClases(data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [seminarioId]);

  const cargarMateriales = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/tutor/seminarios/${seminarioId}/materiales`);
      setMateriales(data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [seminarioId]);

  const cargarEstudiantes = useCallback(async () => {
    try {
      const { data } = await api.get(`/tutor/seminarios/${seminarioId}/estudiantes`);
      setEstudiantes(data.data || []);
    } catch (e) { console.error(e); }
  }, [seminarioId]);

  useEffect(() => {
    if (seccion === 'inicio')       { cargarDashboard(); cargarActividades(); }
    else if (seccion === 'actividades') cargarActividades();
    else if (seccion === 'clases')      cargarClases();
    else if (seccion === 'materiales')  { cargarMateriales(); cargarEstudiantes(); }
  }, [seccion, cargarDashboard, cargarActividades, cargarClases, cargarMateriales, cargarEstudiantes]);

  // ── Acciones ──────────────────────────────────────────────
  const submitActividad = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(formActividad).forEach(([k,v]) => {
      if (k === 'archivos') v.forEach(f => fd.append('archivos[]', f));
      else fd.append(k, v);
    });
    try {
      if (editando) await api.post(`/tutor/seminarios/${seminarioId}/actividades/${editando}?_method=PUT`, fd);
      else          await api.post(`/tutor/seminarios/${seminarioId}/actividades`, fd);
      setModalActividad(false); resetForms(); cargarActividades();
    } catch (e) { console.error(e); alert('Error al guardar'); }
  };

  const submitClase = async (e) => {
    e.preventDefault();
    try {
      if (editando) await api.put(`/tutor/seminarios/${seminarioId}/clases/${editando}`, formClase);
      else          await api.post(`/tutor/seminarios/${seminarioId}/clases`, formClase);
      setModalClase(false); resetForms(); cargarClases(); cargarDashboard();
    } catch (e) { console.error(e); alert('Error al guardar'); }
  };

  const submitMaterial = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(formMaterial).forEach(([k,v]) => {
      if (k === 'archivos') v.forEach(f => fd.append('archivos[]', f));
      else fd.append(k, v);
    });
    try {
      await api.post(`/tutor/seminarios/${seminarioId}/materiales`, fd);
      setModalMaterial(false); resetForms(); cargarMateriales();
    } catch (e) { console.error(e); alert('Error al guardar'); }
  };

  const resetForms = () => {
    setFormActividad({ titulo:'', descripcion:'', fecha_limite:'', hora_limite:'23:59', tipo:'tarea', puntaje:5, archivos:[] });
    setFormClase({ titulo:'', descripcion:'', fecha:'', hora:'', duracion:90, plataforma:'Zoom', enlace:'' });
    setFormMaterial({ titulo:'', descripcion:'', tipo:'video_links', plataforma:'youtube', enlace:'', thumbnail_url:'', estudiante_id:'', archivos:[] });
    setFormGrabacion({ clase_id:'', url_grabacion:'', descripcion:'' });
    setEditando(null);
    setMaterialCategory('');
  };

  const cerrarSesion = () => { localStorage.clear(); navigate('/login'); };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="tutor-dashboard">

      {/* ─── SIDEBAR ────────────────────────────────────────── */}
      <aside className="tutor-sidebar">
        <div className="sidebar-header">
          <h3>
            <img src="/IMG/logofet.png" alt="FET Logo" className="logo-img" />
          </h3>
          <div className="tutor-profile-sidebar">
            <div className="tutor-avatar-sidebar-container">
              <i className="fas fa-user-tie"></i>
            </div>
            <div className="tutor-profile-text">
              <div className="tutor-nombre">
                {userName}
              </div>
              <div className="tutor-rol">Tutor Seminario</div>
            </div>
          </div>
        </div>

        <ul className="nav-list">
          <li><a className={seccion === 'inicio'       ? 'active' : ''} onClick={() => setSeccion('inicio')}><i className="fas fa-home"></i> Inicio</a></li>
          <li><a className={seccion === 'actividades'  ? 'active' : ''} onClick={() => setSeccion('actividades')}><i className="fas fa-tasks"></i> Actividades</a></li>
          <li><a className={seccion === 'clases'       ? 'active' : ''} onClick={() => setSeccion('clases')}><i className="fas fa-video"></i> Aula Virtual</a></li>
          <li><a className={seccion === 'materiales'   ? 'active' : ''} onClick={() => setSeccion('materiales')}><i className="fas fa-book"></i> Material de Apoyo</a></li>
        </ul>

        <button className="logout-link" onClick={cerrarSesion}>
          <i className="fas fa-sign-out-alt"></i> Cerrar sesión
        </button>
      </aside>

      {/* ─── MAIN CONTENT ───────────────────────────────────── */}
      <main className="tutor-main">

        {/* Header Dinámico */}
        <div className="t-header">
          <div className="t-header-text">
            <h1>
              {seccion === 'inicio' ? 'Panel de Control' : 
               seccion === 'actividades' ? 'Gestión de Actividades' : 
               seccion === 'clases' ? 'Aula Virtual' : 
               'Material de Apoyo'}
            </h1>
            {seccion === 'clases' && <p>Gestiona tus clases virtuales y grabaciones</p>}
          </div>
          {seccion === 'actividades' && (
            <button className="t-btn" onClick={() => { resetForms(); setModalActividad(true); }}>
              <i className="fas fa-plus t-mr-1"></i>Nueva Actividad
            </button>
          )}
        </div>

        {/* ════════ INICIO ════════ */}
        {seccion === 'inicio' && (
          <>
            {/* Stats */}
            <div className="t-stats">
              <div className="t-stat-card">
                <div className="t-stat-icon students"><i className="fas fa-users"></i></div>
                <div className="t-stat-info">
                  <h3>{loading ? '…' : (stats?.total_estudiantes ?? 0)}</h3>
                  <p>Estudiantes</p>
                </div>
              </div>
              <div className="t-stat-card">
                <div className="t-stat-icon activities"><i className="fas fa-tasks"></i></div>
                <div className="t-stat-info">
                  <h3>{loading ? '…' : (stats?.total_actividades ?? 0)}</h3>
                  <p>Actividades</p>
                </div>
              </div>
              <div className="t-stat-card">
                <div className="t-stat-icon pending"><i className="fas fa-clock"></i></div>
                <div className="t-stat-info">
                  <h3>{loading ? '…' : (stats?.entregas_pendientes ?? 0)}</h3>
                  <p>Pendientes de calificar</p>
                </div>
              </div>
            </div>

            {/* Row: col-main (8) + col-aside (4) */}
            <div className="t-dashboard-row">

              {/* Columna principal */}
              <div className="t-col-main">

                {/* Próxima Clase */}
                {proximaClase ? (
                  <div className="t-next-class">
                    <div className="t-class-header">
                      <h5 className="t-class-title">{proximaClase.titulo}</h5>
                      <span className="t-class-date">{fmt(proximaClase.fecha)}</span>
                    </div>
                    <div className="t-class-info">
                      <span className="t-class-platform"><i className="fas fa-video"></i> {proximaClase.plataforma}</span>
                      <span className="t-class-time"><i className="far fa-clock"></i> {fmtH(proximaClase.hora)} ({proximaClase.duracion} min)</span>
                      <span className="t-class-date"><i className="fas fa-calendar-alt"></i> {fmtD(proximaClase.fecha)}</span>
                    </div>
                    <a href={proximaClase.enlace} target="_blank" rel="noreferrer" className="t-class-link">
                      <i className="fas fa-sign-in-alt"></i> Iniciar clase
                    </a>
                  </div>
                ) : (
                  <div className="t-next-class">
                    <div className="t-class-header">
                      <h5 className="t-class-title">No hay clases programadas</h5>
                    </div>
                    <p className="t-text-muted">No tienes clases programadas próximamente.</p>
                    
                    <button className="t-class-link" onClick={() => { resetForms(); setModalClase(true); }}>
                      <i className="fas fa-plus"></i> Programar una clase
                    </button>
                  </div>
                )}

                {/* Próximas Actividades */}
                <div className="t-card">
                  <div className="t-card-header">
                    <i className="fas fa-calendar-alt"></i> Próximas Actividades
                  </div>
                  <div className="t-card-body">
                    {proximasActivs.length > 0 ? (
                      <>
                        <ul className="t-activity-list">
                          {proximasActivs.map(act => (
                            <li key={act.id} className="t-activity-item">
                              <div className="t-activity-icon">
                                <i className={`fas ${iconoTipo(act.tipo)}`}></i>
                              </div>
                              <div className="t-activity-info">
                                <h5 className="t-activity-title">{act.titulo}</h5>
                                <span className="t-activity-date">Fecha límite: {fmtD(act.fecha_limite)}</span>
                              </div>
                              <div className="t-activity-actions">
                                <button className="t-btn t-btn-sm" onClick={() => setSeccion('actividades')} title="Ver actividades">
                                  <i className="fas fa-eye"></i>
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <button className="t-view-all" onClick={() => setSeccion('actividades')}>
                          Ver todas las actividades
                        </button>
                      </>
                    ) : (
                      <p className="t-text-muted t-text-center">No hay actividades próximas.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Columna lateral — Acciones Rápidas */}
              <div className="t-col-aside">
                <div className="t-card t-card-full-height">
                  <div className="t-card-header">
                    <i className="fas fa-bolt"></i> Acciones Rápidas
                  </div>
                  <div className="t-card-body">
                    <button className="t-btn t-btn-block" onClick={() => { resetForms(); setModalActividad(true); }}>
                      <i className="fas fa-plus"></i> Nueva Actividad
                    </button>
                    <button className="t-btn t-btn-block" onClick={() => { resetForms(); setModalClase(true); }}>
                      <i className="fas fa-video"></i> Programar Clase
                    </button>
                    <button className="t-btn t-btn-block" onClick={() => { resetForms(); setModalMaterial(true); }}>
                      <i className="fas fa-book"></i> Compartir Material
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ════════ ACTIVIDADES ════════ */}
        {seccion === 'actividades' && (
          <>
            <div className="t-stats">
              <div className="t-stat-card">
                <div className="t-stat-icon activities"><i className="fas fa-tasks"></i></div>
                <div className="t-stat-info">
                  <h3>{stats?.total_actividades ?? 0}</h3>
                  <p>Actividades Totales</p>
                </div>
              </div>
              <div className="t-stat-card">
                <div className="t-stat-icon pending"><i className="fas fa-clipboard-check"></i></div>
                <div className="t-stat-info">
                  <h3>{stats?.entregas_pendientes ?? 0}</h3>
                  <p>Entregas por Calificar</p>
                </div>
              </div>
              <div className="t-stat-card">
                <div className="t-stat-icon vencidas">
                  <i className="fas fa-calendar-times"></i>
                </div>
                <div className="t-stat-info">
                  <h3>{stats?.actividades_vencidas ?? 0}</h3>
                  <p>Actividades Vencidas</p>
                </div>
              </div>
            </div>

            <div className="t-filter-tabs">
              <div className={`t-filter-tab ${filtro === 'todas' ? 'active' : ''}`} onClick={() => setFiltro('todas')}>Todas</div>
              <div className={`t-filter-tab ${filtro === 'pendientes' ? 'active' : ''}`} onClick={() => setFiltro('pendientes')}>Pendientes</div>
              <div className={`t-filter-tab ${filtro === 'vencidas' ? 'active' : ''}`} onClick={() => setFiltro('vencidas')}>Vencidas</div>
              <div className={`t-filter-tab ${filtro === 'calificadas' ? 'active' : ''}`} onClick={() => setFiltro('calificadas')}>Calificadas</div>
            </div>

            <div className="t-activities-container">
              {loading ? (
                <p>Cargando...</p>
              ) : actividades.length === 0 ? (
                <div className="t-empty-state">
                  <i className="fas fa-tasks"></i>
                  <h3>No hay actividades</h3>
                  <p>Comienza creando una nueva actividad para tus estudiantes.</p>
                  <button className="t-btn t-btn-sm t-mt-3" onClick={() => { resetForms(); setModalActividad(true); }}>
                    <i className="fas fa-plus t-mr-2"></i>Nueva Actividad
                  </button>
                </div>
              ) : (
                actividades.map(act => (
                  <div key={act.id} className="t-activity-card">
                    <div className="t-activity-card-header">
                      <h3 className="t-activity-card-title">
                        <i className={`fas ${iconoTipo(act.tipo)}`}></i>
                        {act.titulo}
                      </h3>
                      <span className="t-activity-card-date">
                        Fecha límite: {fmtD(act.fecha_limite)}
                      </span>
                    </div>
                    <div className="t-activity-card-body">
                      <div className="t-activity-desc">
                        {act.descripcion || 'Sin descripción'}
                      </div>
                      <div className="t-activity-meta-grid">
                        <div className="t-meta-item">
                          <i className="fas fa-clock"></i>
                          <span>Hora límite: {fmtH(act.hora_limite)}</span>
                        </div>
                        <div className="t-meta-item">
                          <i className="fas fa-star"></i>
                          <span>Puntaje: {act.puntaje}</span>
                        </div>
                        <div className="t-meta-item">
                          <i className="fas fa-calendar-plus"></i>
                          <span>Creada: {act.created_at ? fmtD(act.created_at) : '—'}</span>
                        </div>
                      </div>
                      
                      <div className="t-activity-actions-row">
                        {filtro === 'calificadas' ? (
                          <div className="t-calificacion-resumen">
                            <div className="t-calificacion-badge">
                              <i className="fas fa-star t-mr-1"></i> Calificación promedio: <strong>{act.calificacion_promedio ?? '0.0'}/{act.puntaje}</strong>
                            </div>
                            <div className="t-entregas-badge">
                              <i className="fas fa-check-circle t-mr-1"></i> {act.entregas_calificadas ?? 0} entregas calificadas
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="t-activity-actions-flex">
                              <button className="t-btn t-btn-info t-btn-sm" onClick={() => alert('Ver Detalles: ' + act.id)}>
                                <i className="fas fa-eye t-mr-1"></i> Ver Detalles
                              </button>
                              
                              <button className="t-btn t-btn-success t-btn-sm" onClick={() => alert('Calificar: ' + act.id)}>
                                <i className="fas fa-check-circle t-mr-1"></i> Calificar / Entregas
                              </button>
                            </div>
                            
                            <div>
                              <span className="t-badge t-badge-orange">
                                <i className="fas fa-inbox t-mr-1"></i> {act.entregas_pendientes ?? 0} entregas por calificar
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ════════ CLASES ════════ */}
        {seccion === 'clases' && (
          <div className="t-clases-layout">
            <div className="t-dashboard-row">
              {/* Columna Izquierda: Próximas y Acciones */}
              <div className="t-col-side">
                <div className="t-card">
                  <div className="t-card-header">
                    <i className="fas fa-calendar-alt"></i> Próximas Clases
                  </div>
                  <div className="t-card-body">
                    {proximaClase ? (
                      <div className="t-upcoming-class">
                        <div className="t-class-icon">
                          <i className="fas fa-video"></i>
                        </div>
                        <div className="t-class-details">
                          <h5 className="t-class-name" title={proximaClase.titulo}>{proximaClase.titulo}</h5>
                          <div className="t-class-time">
                            <i className="far fa-calendar"></i> {fmtD(proximaClase.fecha)}
                          </div>
                          <div className="t-class-time">
                            <i className="far fa-clock"></i> {fmtH(proximaClase.hora)} ({proximaClase.duracion} min)
                          </div>
                        </div>
                        <a href={proximaClase.enlace} target="_blank" rel="noreferrer" className="t-btn t-btn-sm t-join-button">
                          <i className="fas fa-sign-in-alt"></i>
                        </a>
                      </div>
                    ) : (
                      <div className="t-text-center">
                        <p className="t-text-muted">No hay clases programadas próximamente.</p>
                        <button className="t-btn t-btn-sm t-mt-3" onClick={() => { resetForms(); setModalClase(true); }}>
                          <i className="fas fa-plus-circle t-mr-1"></i> Programar Clase
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="t-card">
                  <div className="t-card-header">
                    <i className="fas fa-plus-circle"></i> Acciones Rápidas
                  </div>
                  <div className="t-card-body">
                    <button className="t-btn t-btn-block" onClick={() => { resetForms(); setModalClase(true); }}>
                      <i className="fas fa-calendar-plus t-mr-1"></i> Nueva Clase
                    </button>
                    <button className="t-btn t-btn-info t-btn-block" onClick={() => { resetForms(); setModalGrabacion(true); }}>
                      <i className="fas fa-film t-mr-1"></i> Subir Grabación
                    </button>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Listado de Clases */}
              <div className="t-col-main">
                <div className="t-card t-card-full-height">
                  <div className="t-card-header">
                    <i className="fas fa-video"></i> Mis Clases Virtuales
                  </div>
                  <div className="t-card-body t-empty-state-container">
                    {clases.length > 0 ? (
                      clases.map(clase => (
                        <div key={clase.id} className="t-card-class">
                          <div className="t-card-class-header">
                            <h5 className="t-card-class-title">
                              {clase.titulo}
                              {clase.url_grabacion && (
                                <span className="t-recording-badge">
                                  <i className="fas fa-video t-mr-1"></i> Grabación disponible
                                </span>
                              )}
                            </h5>
                            <span className="t-activity-card-date">{fmtD(clase.fecha)}</span>
                          </div>
                          <div className="t-card-class-body">
                            <p className="t-text-muted">{clase.descripcion || 'Sin descripción'}</p>
                            <div className="t-class-info-row">
                              <div className="t-info-item">
                                <i className="far fa-clock"></i>
                                <span>{fmtH(clase.hora)} ({clase.duracion} min)</span>
                              </div>
                              <div className="t-info-item">
                                <i className="fas fa-video"></i>
                                <span>{clase.plataforma}</span>
                              </div>
                            </div>
                            <div className="t-activity-actions-row">
                              <div className="t-activity-actions-flex">
                                <a href={clase.enlace} target="_blank" rel="noreferrer" className="t-btn t-btn-sm">
                                  <i className="fas fa-sign-in-alt t-mr-1"></i> Iniciar
                                </a>
                                <button className="t-btn t-btn-warning t-btn-sm" onClick={() => alert('Editar: ' + clase.id)}>
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button className="t-btn t-btn-danger t-btn-sm" onClick={() => alert('Eliminar: ' + clase.id)}>
                                  <i className="fas fa-trash"></i>
                                </button>
                                {clase.url_grabacion ? (
                                  <a href={clase.url_grabacion} target="_blank" rel="noreferrer" className="t-btn t-btn-success t-btn-sm">
                                    <i className="fas fa-play-circle t-mr-1"></i> Ver Grabación
                                  </a>
                                ) : (
                                  <button className="t-btn t-btn-info t-btn-sm" onClick={() => { resetForms(); setFormGrabacion({...formGrabacion, clase_id: clase.id}); setModalGrabacion(true); }}>
                                    <i className="fas fa-film t-mr-1"></i> Subir Grabación
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="t-empty-state t-empty-state-no-box">
                        <i className="fas fa-video-slash t-empty-state-icon-large"></i>
                        <h3>No hay clases creadas</h3>
                        <p className="t-text-muted">Comienza creando una nueva clase virtual para tus estudiantes</p>
                        <button className="t-btn t-btn-sm t-mt-3" onClick={() => { resetForms(); setModalClase(true); }}>
                          <i className="fas fa-plus-circle t-mr-1"></i> Nueva Clase
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Fila Inferior: Grabaciones */}
            <div className="t-card">
              <div className="t-card-header">
                <i className="fas fa-film t-mr-1"></i> Mis Grabaciones
              </div>
              <div className="t-card-body">
                {grabaciones.length > 0 ? (
                  <div className="t-table-responsive">
                    <table className="t-table">
                      <thead>
                        <tr>
                          <th>Clase</th>
                          <th>Descripción</th>
                          <th>Fecha</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grabaciones.map(grab => (
                          <tr key={grab.id}>
                            <td>{grab.titulo_clase || 'Clase Archivada'}</td>
                            <td>{grab.descripcion || <em>Sin descripción</em>}</td>
                            <td>{grab.fecha_subida ? fmtD(grab.fecha_subida) : '—'}</td>
                            <td>
                              <div className="t-activity-actions-flex">
                                <a href={grab.url_grabacion} target="_blank" rel="noreferrer" className="t-btn t-btn-info t-btn-sm">
                                  <i className="fas fa-play-circle"></i>
                                </a>
                                <button className="t-btn t-btn-warning t-btn-sm" onClick={() => alert('Editar grab: ' + grab.id)}>
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button className="t-btn t-btn-danger t-btn-sm" onClick={() => alert('Eliminar grab: ' + grab.id)}>
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="t-text-center">
                    <i className="fas fa-film t-empty-state-icon-large"></i>
                    <p className="t-text-muted">No has subido grabaciones aún.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════ MATERIALES ════════ */}
        {seccion === 'materiales' && (
          <div className="t-card">
            <div className="t-card-header">
              <i className="fas fa-book"></i> Material de Apoyo
              {materialCategory && (
                <button className="t-btn t-btn-sm t-ml-auto" onClick={() => setMaterialCategory('')}>
                  <i className="fas fa-arrow-left t-mr-1"></i> Volver
                </button>
              )}
            </div>
            <div className="t-card-body">
              {!materialCategory ? (
                /* Selección de Categoría */
                <div className="t-material-selection">
                  <h3>Selecciona el tipo de material que deseas compartir</h3>
                  <div className="t-category-grid">
                    <div className="t-category-card" onClick={() => setMaterialCategory('video_links')}>
                      <div className="t-category-icon-wrapper">
                        <i className="fas fa-video"></i>
                      </div>
                      <h4>Enlaces de Video</h4>
                      <p>Comparte videos de TikTok, Instagram, YouTube y más</p>
                    </div>
                    
                    <div className="t-category-card" onClick={() => alert('Próximamente: Documentación')}>
                      <div className="t-category-icon-wrapper">
                        <i className="fas fa-file-alt"></i>
                      </div>
                      <h4>Documentación</h4>
                      <p>Comparte guías, PDFs y material de lectura</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Formulario de Material (Video Links) */
                <div className="t-material-form-container">
                  <div className="t-form-header-simple t-text-center">
                     <div className="t-header-text">
                        <h2 className="t-form-title-flex t-justify-center">
                           <i className="fas fa-video"></i>
                           Compartir Enlaces de Video
                        </h2>
                     </div>
                  </div>

                  {/* Pasos de Progreso */}
                  <div className="t-progress-steps">
                    <div className="t-step active">
                      <div className="t-step-number">1</div>
                      <div className="t-step-label">Detalles del Video</div>
                    </div>
                    <div className="t-step">
                      <div className="t-step-number">2</div>
                      <div className="t-step-label">Confirmación</div>
                    </div>
                  </div>

                  <form onSubmit={submitMaterial} className="t-upload-form">
                    <div className="t-form-group">
                      <label>Título del Material *</label>
                      <input 
                        type="text" 
                        required 
                        value={formMaterial.titulo} 
                        onChange={e => setFormMaterial({...formMaterial, titulo: e.target.value})} 
                        placeholder="Ej: Tutorial de React"
                      />
                    </div>

                    <div className="t-form-group">
                      <label>Descripción</label>
                      <textarea 
                        rows="3" 
                        value={formMaterial.descripcion} 
                        onChange={e => setFormMaterial({...formMaterial, descripcion: e.target.value})}
                        placeholder="Breve descripción del contenido"
                      ></textarea>
                    </div>

                    <div className="t-form-row">
                      <div className="t-form-group">
                        <label>Plataforma *</label>
                        <select 
                          required 
                          value={formMaterial.plataforma} 
                          onChange={e => {
                            const plat = e.target.value;
                            setFormMaterial({...formMaterial, plataforma: plat, thumbnail_url: ''});
                          }}
                        >
                          <option value="youtube">YouTube</option>
                          <option value="vimeo">Vimeo</option>
                          <option value="tiktok">TikTok</option>
                          <option value="instagram">Instagram</option>
                          <option value="facebook">Facebook</option>
                          <option value="other">Otro</option>
                        </select>
                      </div>

                      <div className="t-form-group">
                        <label>URL del Video *</label>
                        <input 
                          type="url" 
                          required 
                          value={formMaterial.enlace} 
                          onChange={e => {
                            const url = e.target.value;
                            let thumb = '';
                            if (formMaterial.plataforma === 'youtube') {
                              const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                              if (match) thumb = `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
                            }
                            setFormMaterial({...formMaterial, enlace: url, thumbnail_url: thumb});
                          }}
                          placeholder="https://..."
                        />
                        <p className="t-text-muted t-mt-1" style={{ fontSize: '0.85rem' }}>Pega la URL del video que deseas compartir</p>
                      </div>
                    </div>

                    <div className="t-form-group">
                      <label>Vista previa de la miniatura</label>
                      <div className="t-thumbnail-preview">
                        {formMaterial.thumbnail_url ? (
                          <img src={formMaterial.thumbnail_url} alt="Miniatura" />
                        ) : (
                          <div className="t-no-thumbnail">
                            <i className="fas fa-image"></i>
                            <p>La miniatura se generará automáticamente</p>
                          </div>
                        )}
                      </div>
                      <p className="t-text-muted t-mt-1" style={{ fontSize: '0.85rem' }}>La miniatura se generará automáticamente a partir de la URL del video (YouTube)</p>
                    </div>

                    <div className="t-form-group">
                      <label>Asignar a estudiante específico (opcional)</label>
                      <select 
                        value={formMaterial.estudiante_id} 
                        onChange={e => setFormMaterial({...formMaterial, estudiante_id: e.target.value})}
                      >
                        <option value="">Todos los estudiantes</option>
                        {estudiantes.map(est => (
                          <option key={est.id} value={est.id}>
                            {est.nombre} ({est.email})
                          </option>
                        ))}
                      </select>
                      <p className="t-text-muted t-mt-1" style={{ fontSize: '0.85rem' }}>Si no selecciona ningún estudiante, el material se compartirá con todos.</p>
                    </div>

                    <div className="t-form-actions" style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                      <button type="button" className="t-btn t-btn-secondary" onClick={() => setMaterialCategory('')}>
                        Cancelar
                      </button>
                      <button type="submit" className="t-btn">
                        <i className="fas fa-paper-plane t-mr-2"></i>Publicar Video
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ─── MODAL: Nueva Actividad ─────────────────────────── */}
      {modalActividad && (
        <div className="t-modal-overlay">
          <div className="t-modal-content">
            <div className="t-modal-header">
              <h2><i className="fas fa-tasks"></i> {editando ? 'Editar' : 'Nueva'} Actividad</h2>
              <button className="t-modal-close" onClick={() => setModalActividad(false)}>×</button>
            </div>
            <form onSubmit={submitActividad}>
              <div className="t-modal-body">
                <div className="t-form-group">
                  <label>Título *</label>
                  <input required value={formActividad.titulo} onChange={e => setFormActividad({...formActividad, titulo: e.target.value})} />
                </div>
                <div className="t-form-group">
                  <label>Descripción</label>
                  <textarea rows="3" value={formActividad.descripcion} onChange={e => setFormActividad({...formActividad, descripcion: e.target.value})}></textarea>
                </div>
                <div className="t-form-row">
                  <div className="t-form-group">
                    <label>Fecha Límite *</label>
                    <input type="date" required value={formActividad.fecha_limite} onChange={e => setFormActividad({...formActividad, fecha_limite: e.target.value})} />
                  </div>
                  <div className="t-form-group">
                    <label>Hora Límite</label>
                    <input type="time" value={formActividad.hora_limite} onChange={e => setFormActividad({...formActividad, hora_limite: e.target.value})} />
                  </div>
                </div>
                <div className="t-form-row">
                  <div className="t-form-group">
                    <label>Tipo</label>
                    <select value={formActividad.tipo} onChange={e => setFormActividad({...formActividad, tipo: e.target.value})}>
                      <option value="tarea">Tarea</option>
                      <option value="proyecto">Proyecto</option>
                      <option value="examen">Examen</option>
                      <option value="cuestionario">Cuestionario</option>
                      <option value="investigacion">Investigación</option>
                    </select>
                  </div>
                  <div className="t-form-group">
                    <label>Puntaje</label>
                    <input type="number" min="0" max="10" value={formActividad.puntaje} onChange={e => setFormActividad({...formActividad, puntaje: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="t-modal-footer">
                <button type="button" className="t-btn-cancel" onClick={() => setModalActividad(false)}>Cancelar</button>
                <button type="submit" className="t-btn-save">Guardar Actividad</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Nueva Clase ─────────────────────────────── */}
      {modalClase && (
        <div className="t-modal-overlay">
          <div className="t-modal-content">
            <div className="t-modal-header">
              <h2><i className="fas fa-video"></i> {editando ? 'Editar' : 'Nueva'} Clase Virtual</h2>
              <button className="t-modal-close" onClick={() => setModalClase(false)}>×</button>
            </div>
            <form onSubmit={submitClase}>
              <div className="t-modal-body">
                <div className="t-form-group">
                  <label>Título *</label>
                  <input required value={formClase.titulo} onChange={e => setFormClase({...formClase, titulo: e.target.value})} />
                </div>
                <div className="t-form-row">
                  <div className="t-form-group">
                    <label>Fecha *</label>
                    <input type="date" required value={formClase.fecha} onChange={e => setFormClase({...formClase, fecha: e.target.value})} />
                  </div>
                  <div className="t-form-group">
                    <label>Hora *</label>
                    <input type="time" required value={formClase.hora} onChange={e => setFormClase({...formClase, hora: e.target.value})} />
                  </div>
                </div>
                <div className="t-form-row">
                  <div className="t-form-group">
                    <label>Plataforma</label>
                    <select value={formClase.plataforma} onChange={e => setFormClase({...formClase, plataforma: e.target.value})}>
                      <option value="Zoom">Zoom</option>
                      <option value="Google Meet">Google Meet</option>
                      <option value="Microsoft Teams">Microsoft Teams</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div className="t-form-group">
                    <label>Duración (min)</label>
                    <input type="number" min="30" value={formClase.duracion} onChange={e => setFormClase({...formClase, duracion: e.target.value})} />
                  </div>
                </div>
                <div className="t-form-group">
                  <label>Enlace *</label>
                  <input type="url" required value={formClase.enlace} onChange={e => setFormClase({...formClase, enlace: e.target.value})} placeholder="https://..." />
                </div>
              </div>
              <div className="t-modal-footer">
                <button type="button" className="t-btn-cancel" onClick={() => setModalClase(false)}>Cancelar</button>
                <button type="submit" className="t-btn-save">Programar Clase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Subir Material ──────────────────────────── */}
      {modalMaterial && (
        <div className="t-modal-overlay">
          <div className="t-modal-content">
            <div className="t-modal-header">
              <h2><i className="fas fa-book"></i> Compartir Material</h2>
              <button className="t-modal-close" onClick={() => setModalMaterial(false)}>×</button>
            </div>
            <form onSubmit={submitMaterial}>
              <div className="t-modal-body">
                <div className="t-form-group">
                  <label>Título *</label>
                  <input required value={formMaterial.titulo} onChange={e => setFormMaterial({...formMaterial, titulo: e.target.value})} />
                </div>
                <div className="t-form-group">
                  <label>Descripción</label>
                  <textarea rows="3" value={formMaterial.descripcion} onChange={e => setFormMaterial({...formMaterial, descripcion: e.target.value})}></textarea>
                </div>
                <div className="t-form-group">
                  <label>Tipo</label>
                  <select value={formMaterial.tipo} onChange={e => setFormMaterial({...formMaterial, tipo: e.target.value})}>
                    <option value="documento">Documento</option>
                    <option value="video">Video</option>
                    <option value="enlace">Enlace</option>
                    <option value="presentacion">Presentación</option>
                  </select>
                </div>
                <div className="t-form-group">
                  <label>Archivos</label>
                  <input type="file" multiple onChange={e => setFormMaterial({...formMaterial, archivos: Array.from(e.target.files)})} />
                </div>
              </div>
              <div className="t-modal-footer">
                <button type="button" className="t-btn-cancel" onClick={() => setModalMaterial(false)}>Cancelar</button>
                <button type="submit" className="t-btn-save">Compartir</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Subir Grabación ─────────────────────────── */}
      {modalGrabacion && (
        <div className="t-modal-overlay">
          <div className="t-modal-content">
            <div className="t-modal-header">
              <h2><i className="fas fa-film"></i> Subir Grabación</h2>
              <button className="t-modal-close" onClick={() => setModalGrabacion(false)}>×</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); alert('Grabación guardada'); setModalGrabacion(false); }}>
              <div className="t-modal-body">
                {!formGrabacion.clase_id && (
                  <div className="t-form-group">
                    <label>Seleccionar Clase</label>
                    <select value={formGrabacion.clase_id} onChange={e => setFormGrabacion({...formGrabacion, clase_id: e.target.value})} required>
                      <option value="">Seleccione una clase...</option>
                      {clases.map(c => <option key={c.id} value={c.id}>{c.titulo} ({fmtD(c.fecha)})</option>)}
                    </select>
                  </div>
                )}
                <div className="t-form-group">
                  <label>URL de la Grabación</label>
                  <input type="url" required value={formGrabacion.url_grabacion} onChange={e => setFormGrabacion({...formGrabacion, url_grabacion: e.target.value})} placeholder="https://..." />
                  <small className="t-text-muted">YouTube, Vimeo, etc.</small>
                </div>
                <div className="t-form-group">
                  <label>Descripción (Opcional)</label>
                  <textarea rows="3" value={formGrabacion.descripcion} onChange={e => setFormGrabacion({...formGrabacion, descripcion: e.target.value})}></textarea>
                </div>
              </div>
              <div className="t-modal-footer">
                <button type="button" className="t-btn-cancel" onClick={() => setModalGrabacion(false)}>Cancelar</button>
                <button type="submit" className="t-btn-save">Subir Grabación</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
