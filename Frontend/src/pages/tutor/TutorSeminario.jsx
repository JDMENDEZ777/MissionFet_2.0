import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './TutorSeminario.css';

// ─────────────────────────────────────────────────────────────
// Utilidades auxiliares
// ─────────────────────────────────────────────────────────────

const iconoTipo = (tipo) => {
  const iconos = {
    tarea: 'fa-clipboard-list',
    proyecto: 'fa-diagram-project',
    examen: 'fa-file-alt',
    cuestionario: 'fa-question-circle',
    investigacion: 'fa-search',
  };
  return iconos[tipo] || 'fa-tasks';
};

const formatFecha = (dateStr) => {
  if (!dateStr) return '—';
  const fecha = new Date(dateStr);
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
  return `${dias[fecha.getDay()]} ${fecha.getDate()} de ${meses[fecha.getMonth()]}`;
};

// ─────────────────────────────────────────────────────────────
// Componente principal: TutorSeminario
// ─────────────────────────────────────────────────────────────

export default function TutorSeminario() {
  const navigate = useNavigate();

  const seminarioId = localStorage.getItem('seminario_id') || 1;
  const userName    = localStorage.getItem('user_name') || 'Tutor';
  const userAvatar  = localStorage.getItem('user_avatar') || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

  // ── Estado global ──────────────────────────────────────────
  const [seccion, setSeccion]       = useState('inicio');   // inicio | actividades | clases | materiales
  const [filtro, setFiltro]         = useState('todas');
  const [loading, setLoading]       = useState(false);

  // Datos
  const [stats, setStats]             = useState(null);
  const [proximaClase, setProximaClase] = useState(null);
  const [ultimasEntregas, setUltimasEntregas] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [clases, setClases]           = useState([]);
  const [materiales, setMateriales]   = useState([]);

  // Modales
  const [modalActividad, setModalActividad] = useState(false);
  const [modalClase, setModalClase]         = useState(false);
  const [modalMaterial, setModalMaterial]   = useState(false);
  const [editando, setEditando] = useState(null);

  // Formularios
  const [formActividad, setFormActividad] = useState({
    titulo: '', descripcion: '', fecha_limite: '', hora_limite: '23:59',
    tipo: 'tarea', puntaje: 5, permitir_entregas_tarde: false, archivos: [],
  });
  const [formClase, setFormClase] = useState({
    titulo: '', descripcion: '', fecha: '', hora: '', duracion: 90,
    plataforma: 'Zoom', enlace: '',
  });
  const [formMaterial, setFormMaterial] = useState({
    titulo: '', descripcion: '', tipo: 'documento', archivos: [],
  });

  // ── Carga de datos ─────────────────────────────────────────
  const cargarDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/tutor/seminarios/${seminarioId}/dashboard`);
      setStats(data.stats);
      setProximaClase(data.proxima_clase);
      setUltimasEntregas(data.ultimas_entregas || []);
    } catch (err) {
      console.error('Error cargando dashboard tutor:', err);
    } finally {
      setLoading(false);
    }
  }, [seminarioId]);

  const cargarActividades = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/tutor/seminarios/${seminarioId}/actividades?filtro=${filtro}`);
      setActividades(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [seminarioId, filtro]);

  const cargarClases = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/tutor/seminarios/${seminarioId}/clases`);
      setClases(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [seminarioId]);

  const cargarMateriales = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/tutor/seminarios/${seminarioId}/materiales`);
      setMateriales(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [seminarioId]);

  useEffect(() => {
    if (seccion === 'inicio')       cargarDashboard();
    else if (seccion === 'actividades')  cargarActividades();
    else if (seccion === 'clases')       cargarClases();
    else if (seccion === 'materiales')   cargarMateriales();
  }, [seccion, filtro, cargarDashboard, cargarActividades, cargarClases, cargarMateriales]);

  // ── Acciones (Simplificadas para el Rediseño) ───────────────
  const submitActividad = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(formActividad).forEach(([k, v]) => {
      if (k === 'archivos') v.forEach((f) => fd.append('archivos[]', f));
      else fd.append(k, v);
    });
    try {
      if (editando) await api.post(`/tutor/seminarios/${seminarioId}/actividades/${editando}?_method=PUT`, fd);
      else await api.post(`/tutor/seminarios/${seminarioId}/actividades`, fd);
      setModalActividad(false);
      resetForms();
      if (seccion === 'actividades') cargarActividades();
      else cargarDashboard();
    } catch (err) { console.error(err); }
  };

  const submitClase = async (e) => {
    e.preventDefault();
    try {
      if (editando) await api.put(`/tutor/seminarios/${seminarioId}/clases/${editando}`, formClase);
      else await api.post(`/tutor/seminarios/${seminarioId}/clases`, formClase);
      setModalClase(false);
      resetForms();
      if (seccion === 'clases') cargarClases();
      else cargarDashboard();
    } catch (err) { console.error(err); }
  };

  const submitMaterial = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(formMaterial).forEach(([k, v]) => {
      if (k === 'archivos') v.forEach((f) => fd.append('archivos[]', f));
      else fd.append(k, v);
    });
    try {
      await api.post(`/tutor/seminarios/${seminarioId}/materiales`, fd);
      setModalMaterial(false);
      resetForms();
      if (seccion === 'materiales') cargarMateriales();
    } catch (err) { console.error(err); }
  };

  const resetForms = () => {
    setFormActividad({ titulo: '', descripcion: '', fecha_limite: '', hora_limite: '23:59', tipo: 'tarea', puntaje: 5, permitir_entregas_tarde: false, archivos: [] });
    setFormClase({ titulo: '', descripcion: '', fecha: '', hora: '', duracion: 90, plataforma: 'Zoom', enlace: '' });
    setFormMaterial({ titulo: '', descripcion: '', tipo: 'documento', archivos: [] });
    setEditando(null);
  };

  const cerrarSesion = () => {
    localStorage.clear();
    navigate('/login');
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="tutor-dashboard">

      {/* ─── SIDEBAR (IDÉNTICO PHP) ─────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h3>
            <img src="/IMG/logofet.png" alt="FET" />
            Tutor Seminario
          </h3>
        </div>
        <ul>
          <li><a href="#" className={seccion === 'inicio' ? 'active' : ''} onClick={() => setSeccion('inicio')}><i className="fas fa-home"></i> Inicio</a></li>
          <li><a href="#" className={seccion === 'actividades' ? 'active' : ''} onClick={() => setSeccion('actividades')}><i className="fas fa-clipboard-list"></i> Actividades</a></li>
          <li><a href="#" className={seccion === 'clases' ? 'active' : ''} onClick={() => setSeccion('clases')}><i className="fas fa-video"></i> Aula Virtual</a></li>
          <li><a href="#" className={seccion === 'materiales' ? 'active' : ''} onClick={() => setSeccion('materiales')}><i className="fas fa-book"></i> Material de Apoyo</a></li>
        </ul>
        <div className="logout-container">
          <button className="logout-btn" onClick={cerrarSesion}>
            <i className="fas fa-sign-out-alt"></i> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ───────────────────────────────────── */}
      <main className="main-content">
        
        {/* Header Superior */}
        <header className="header">
          <h1>Panel de Control</h1>
          <div className="user-profile">
            <img src={userAvatar} alt="Avatar" />
            <span>{userName}</span>
          </div>
        </header>

        {/* ── SECCIÓN: INICIO (Clon PHP) ────────────────────── */}
        {seccion === 'inicio' && (
          <>
            {/* Stats */}
            <div className="stats-container">
              <div className="stat-card">
                <div className="stat-icon students"><i className="fas fa-users"></i></div>
                <div className="stat-info">
                  <h3>{stats?.total_estudiantes || 0}</h3>
                  <p>Estudiantes</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon activities"><i className="fas fa-list-check"></i></div>
                <div className="stat-info">
                  <h3>{stats?.total_actividades || 0}</h3>
                  <p>Actividades</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon pending"><i className="fas fa-clock"></i></div>
                <div className="stat-info">
                  <h3>{stats?.entregas_pendientes || 0}</h3>
                  <p>Pendientes de calificar</p>
                </div>
              </div>
            </div>

            {/* Dashboard Layout Row */}
            <div className="dashboard-row">
              
              {/* Columna Izquierda (Clases y Actividades) */}
              <div className="col-left">
                
                {/* Próxima Clase Card */}
                <div className="card">
                  <div className="card-header"><i className="fas fa-video"></i> Próxima Clase</div>
                  <div className="card-body">
                    {proximaClase ? (
                      <div className="next-class-content">
                        <div className="next-class-header">
                           <span className="next-class-title">{proximaClase.titulo}</span>
                           <span className="next-class-badge">{proximaClase.plataforma}</span>
                        </div>
                        <p><i className="fas fa-calendar"></i> {formatFecha(proximaClase.fecha)} — {proximaClase.hora?.slice(0,5)}</p>
                        <a href={proximaClase.enlace} target="_blank" rel="noreferrer" className="next-class-link">Unirse a la clase</a>
                      </div>
                    ) : (
                      <div className="no-data">
                        <h5>No hay clases programadas</h5>
                        <p>No tienes clases programadas próximamente.</p>
                        <button className="btn-program" onClick={() => setModalClase(true)}>+ Programar una clase</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Próximas Actividades Card */}
                <div className="card">
                  <div className="card-header"><i className="fas fa-calendar-alt"></i> Próximas Actividades</div>
                  <div className="card-body">
                    {actividades.length > 0 ? (
                      actividades.slice(0, 3).map(act => (
                        <div key={act.id} className="list-item">
                          <div className="item-icon"><i className={`fas ${iconoTipo(act.tipo)}`}></i></div>
                          <div className="item-info">
                            <div className="item-title">{act.titulo}</div>
                            <div className="item-meta">Límite: {formatFecha(act.fecha_limite)}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-data"><p>No hay actividades próximas.</p></div>
                    )}
                  </div>
                </div>

              </div>

              {/* Columna Derecha (Acciones Rápidas) */}
              <div className="col-right">
                <div className="actions-card">
                  <div className="actions-header"><i className="fas fa-bolt"></i> Acciones Rápidas</div>
                  <div className="actions-body">
                    <button className="btn-action" onClick={() => { resetForms(); setModalActividad(true); }}><i className="fas fa-plus"></i> Nueva Actividad</button>
                    <button className="btn-action" onClick={() => { resetForms(); setModalClase(true); }}><i className="fas fa-video"></i> Programar Clase</button>
                    <button className="btn-action" onClick={() => { resetForms(); setModalMaterial(true); }}><i className="fas fa-book"></i> Compartir Material</button>
                  </div>
                </div>
              </div>

            </div>
          </>
        )}

        {/* ── OTRAS SECCIONES (Listados) ───────────────────── */}
        {seccion !== 'inicio' && (
          <div className="card">
            <div className="card-header">
              <i className={`fas ${seccion === 'actividades' ? 'fa-clipboard-list' : seccion === 'clases' ? 'fa-video' : 'fa-book'}`}></i>
              {seccion === 'actividades' ? 'Gestión de Actividades' : seccion === 'clases' ? 'Aula Virtual' : 'Material de Apoyo'}
            </div>
            <div className="card-body">
              {loading ? <p>Cargando...</p> : (
                <div className="list-container">
                   {seccion === 'actividades' && actividades.map(act => (
                      <div key={act.id} className="list-item">
                        <div className="item-icon"><i className={`fas ${iconoTipo(act.tipo)}`}></i></div>
                        <div className="item-info">
                          <div className="item-title">{act.titulo}</div>
                          <div className="item-meta">{act.tipo.toUpperCase()} — Límite: {formatFecha(act.fecha_limite)}</div>
                        </div>
                      </div>
                   ))}
                   {seccion === 'clases' && clases.map(cl => (
                      <div key={cl.id} className="list-item">
                        <div className="item-icon"><i className="fas fa-video"></i></div>
                        <div className="item-info">
                          <div className="item-title">{cl.titulo}</div>
                          <div className="item-meta">{cl.plataforma} — {formatFecha(cl.fecha)}</div>
                        </div>
                        <a href={cl.enlace} target="_blank" rel="noreferrer" className="btn-action" style={{ padding: '5px 15px', fontSize: '0.8rem' }}>Unirse</a>
                      </div>
                   ))}
                   {seccion === 'materiales' && materiales.map(mat => (
                      <div key={mat.id} className="list-item">
                        <div className="item-icon"><i className="fas fa-book"></i></div>
                        <div className="item-info">
                          <div className="item-title">{mat.titulo}</div>
                          <div className="item-meta">{mat.tipo.toUpperCase()}</div>
                        </div>
                      </div>
                   ))}
                   {(seccion === 'actividades' && actividades.length === 0) || 
                    (seccion === 'clases' && clases.length === 0) || 
                    (seccion === 'materiales' && materiales.length === 0) ? (
                      <p className="no-data">No se encontraron registros.</p>
                   ) : null}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ─── MODALES ────────────────────────────────────────── */}
      {modalActividad && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2><i className="fas fa-tasks"></i> Nueva Actividad</h2>
              <button className="modal-close" onClick={() => setModalActividad(false)}>&times;</button>
            </div>
            <form onSubmit={submitActividad}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Título</label>
                  <input required value={formActividad.titulo} onChange={e => setFormActividad({...formActividad, titulo: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <textarea rows="3" value={formActividad.descripcion} onChange={e => setFormActividad({...formActividad, descripcion: e.target.value})}></textarea>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>Fecha Límite</label>
                    <input type="date" required value={formActividad.fecha_limite} onChange={e => setFormActividad({...formActividad, fecha_limite: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Hora Límite</label>
                    <input type="time" required value={formActividad.hora_limite} onChange={e => setFormActividad({...formActividad, hora_limite: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setModalActividad(false)}>Cancelar</button>
                <button type="submit" className="btn-save">Guardar Actividad</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Otros modales (Clase, Material) se simplificarán por ahora para cumplir el diseño principal */}
      {modalClase && (
        <div className="modal-overlay">
           <div className="modal-content">
             <div className="modal-header">
               <h2><i className="fas fa-video"></i> Nueva Clase Virtual</h2>
               <button className="modal-close" onClick={() => setModalClase(false)}>&times;</button>
             </div>
             <form onSubmit={submitClase}>
               <div className="modal-body">
                 <div className="form-group"><label>Título</label><input required value={formClase.titulo} onChange={e => setFormClase({...formClase, titulo: e.target.value})} /></div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                   <div className="form-group"><label>Fecha</label><input type="date" required value={formClase.fecha} onChange={e => setFormClase({...formClase, fecha: e.target.value})} /></div>
                   <div className="form-group"><label>Hora</label><input type="time" required value={formClase.hora} onChange={e => setFormClase({...formClase, hora: e.target.value})} /></div>
                 </div>
                 <div className="form-group"><label>Enlace de la Clase</label><input type="url" required value={formClase.enlace} onChange={e => setFormClase({...formClase, enlace: e.target.value})} /></div>
               </div>
               <div className="modal-footer">
                 <button type="button" className="btn-cancel" onClick={() => setModalClase(false)}>Cancelar</button>
                 <button type="submit" className="btn-save">Programar Clase</button>
               </div>
             </form>
           </div>
        </div>
      )}

    </div>
  );
}
