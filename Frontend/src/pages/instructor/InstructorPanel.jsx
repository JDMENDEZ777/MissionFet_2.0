import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './InstructorPanel.css';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Utilidades auxiliares
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Devuelve el icono FontAwesome segÃºn el tipo de actividad */
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

/** Formatea una fecha ISO en formato legible en espaÃ±ol */
const formatFecha = (dateStr) => {
  if (!dateStr) return 'â€”';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Componente principal: TutorSeminario
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function InstructorPanel() {
  const navigate = useNavigate();

  // ID del seminario: en un proyecto real vendrÃ­a de useParams()
  // De momento lo leemos del localStorage (guardado al hacer login)
  const seminarioId = localStorage.getItem('seminario_id') || 1;
  const userName    = localStorage.getItem('user_name') || 'Tutor';

  // â”€â”€ Estado global â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [seccion, setSeccion]       = useState('inicio');   // inicio | actividades | clases | materiales
  const [filtro, setFiltro]         = useState('todas');
  const [loading, setLoading]       = useState(false);

  // Datos de cada secciÃ³n
  const [stats, setStats]             = useState(null);
  const [proximaClase, setProximaClase] = useState(null);
  const [ultimasEntregas, setUltimasEntregas] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [clases, setClases]           = useState([]);
  const [materiales, setMateriales]   = useState([]);

  // Entregas de una actividad para calificar
  const [entregasModal, setEntregasModal]   = useState(null);  // null = cerrado
  const [actividadModal, setActividadModal] = useState(null);

  // Modales de formulario
  const [modalActividad, setModalActividad] = useState(false);
  const [modalClase, setModalClase]         = useState(false);
  const [modalMaterial, setModalMaterial]   = useState(false);

  // EdiciÃ³n
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

  // Calificaciones
  const [calificaciones, setCalificaciones] = useState({});

  // â”€â”€ Carga de datos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // Cargar datos al cambiar de secciÃ³n
  useEffect(() => {
    if (seccion === 'inicio')       cargarDashboard();
    if (seccion === 'actividades')  cargarActividades();
    if (seccion === 'clases')       cargarClases();
    if (seccion === 'materiales')   cargarMateriales();
  }, [seccion, filtro, cargarDashboard, cargarActividades, cargarClases, cargarMateriales]);

  // â”€â”€ Acciones de Actividad â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const submitActividad = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(formActividad).forEach(([k, v]) => {
      if (k === 'archivos') v.forEach((f) => fd.append('archivos[]', f));
      else fd.append(k, v);
    });
    try {
      if (editando) {
        await api.put(`/tutor/seminarios/${seminarioId}/actividades/${editando}`, fd);
      } else {
        await api.post(`/tutor/seminarios/${seminarioId}/actividades`, fd);
      }
      setModalActividad(false);
      resetFormActividad();
      cargarActividades();
    } catch (err) { console.error(err); }
  };

  const eliminarActividad = async (id) => {
    if (!confirm('Â¿Eliminar esta actividad? Se perderÃ¡n todas las entregas asociadas.')) return;
    await api.delete(`/tutor/seminarios/${seminarioId}/actividades/${id}`);
    cargarActividades();
  };

  const abrirEntregas = async (actividad) => {
    try {
      const { data } = await api.get(
        `/tutor/seminarios/${seminarioId}/actividades/${actividad.id}/entregas`
      );
      setActividadModal(data.actividad);
      setEntregasModal(data.entregas || []);
      setCalificaciones({});
    } catch (err) { console.error(err); }
  };

  const calificarEntrega = async (entregaId) => {
    const cal = calificaciones[entregaId];
    if (!cal) return;
    try {
      await api.post(
        `/tutor/seminarios/${seminarioId}/actividades/${actividadModal.id}/entregas/${entregaId}/calificar`,
        { calificacion: cal.nota, comentario_tutor: cal.comentario || '' }
      );
      // Refrescar lista de entregas
      const { data } = await api.get(
        `/tutor/seminarios/${seminarioId}/actividades/${actividadModal.id}/entregas`
      );
      setEntregasModal(data.entregas || []);
    } catch (err) { console.error(err); }
  };

  // â”€â”€ Acciones de Clase Virtual â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const submitClase = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/tutor/seminarios/${seminarioId}/clases/${editando}`, formClase);
      } else {
        await api.post(`/tutor/seminarios/${seminarioId}/clases`, formClase);
      }
      setModalClase(false);
      resetFormClase();
      cargarClases();
    } catch (err) { console.error(err); }
  };

  const eliminarClase = async (id) => {
    if (!confirm('Â¿Eliminar esta clase virtual?')) return;
    await api.delete(`/tutor/seminarios/${seminarioId}/clases/${id}`);
    cargarClases();
  };

  // â”€â”€ Acciones de Material â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const submitMaterial = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('titulo', formMaterial.titulo);
    fd.append('descripcion', formMaterial.descripcion);
    fd.append('tipo', formMaterial.tipo);
    formMaterial.archivos.forEach((f) => fd.append('archivos[]', f));
    try {
      await api.post(`/tutor/seminarios/${seminarioId}/materiales`, fd);
      setModalMaterial(false);
      resetFormMaterial();
      cargarMateriales();
    } catch (err) { console.error(err); }
  };

  const eliminarMaterial = async (id) => {
    if (!confirm('Â¿Eliminar este material?')) return;
    await api.delete(`/tutor/seminarios/${seminarioId}/materiales/${id}`);
    cargarMateriales();
  };

  // â”€â”€ Reset de formularios â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const resetFormActividad = () => {
    setFormActividad({ titulo: '', descripcion: '', fecha_limite: '', hora_limite: '23:59', tipo: 'tarea', puntaje: 5, permitir_entregas_tarde: false, archivos: [] });
    setEditando(null);
  };
  const resetFormClase = () => {
    setFormClase({ titulo: '', descripcion: '', fecha: '', hora: '', duracion: 90, plataforma: 'Zoom', enlace: '' });
    setEditando(null);
  };
  const resetFormMaterial = () => {
    setFormMaterial({ titulo: '', descripcion: '', tipo: 'documento', archivos: [] });
  };

  // â”€â”€ Cerrar sesiÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const cerrarSesion = () => {
    localStorage.clear();
    navigate('/login');
  };

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // RENDER
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  return (
    <div className="ts-layout">

      {/* â”€â”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <aside className="ts-sidebar">
        <div className="ts-sidebar-header">
          <div class="ts-sidebar-brand">Edu<span>Track</span></div>
          <div className="ts-sidebar-profile">
            <div className="ts-avatar-icon"><i className="fas fa-user-tie"></i></div>
            <div>
              <div className="ts-sidebar-name">{userName}</div>
              <div className="ts-sidebar-role">Instructor</div>
            </div>
          </div>
        </div>

        <ul className="ts-sidebar-nav">
          {[
            { id: 'inicio',       icon: 'fa-home',      label: 'Inicio' },
            { id: 'actividades',  icon: 'fa-tasks',      label: 'Actividades' },
            { id: 'clases',       icon: 'fa-video',      label: 'Aula Virtual' },
            { id: 'materiales',   icon: 'fa-book-open',  label: 'Material de Apoyo' },
          ].map(({ id, icon, label }) => (
            <li key={id}>
              <a
                href="#"
                className={seccion === id ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); setSeccion(id); }}
              >
                <i className={`fas ${icon}`}></i> {label}
              </a>
            </li>
          ))}
        </ul>

        <div className="ts-logout">
          <button onClick={cerrarSesion}>
            <i className="fas fa-sign-out-alt"></i> Cerrar sesiÃ³n
          </button>
        </div>
      </aside>

      {/* â”€â”€ Contenido principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <main className="ts-main">

        {/* â”€â”€â”€ INICIO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {seccion === 'inicio' && (
          <>
            <div className="ts-page-header">
              <h1 className="ts-page-title">Panel de <span>Control</span></h1>
            </div>

            {loading ? <Spinner /> : (
              <>
                {/* Stats */}
                <div className="ts-stats-grid">
                  <StatCard icon="fa-users" color="blue" value={stats?.total_estudiantes ?? 'â€”'} label="Estudiantes inscritos" />
                  <StatCard icon="fa-tasks" color="green" value={stats?.total_actividades ?? 'â€”'} label="Actividades creadas" />
                  <StatCard icon="fa-clock" color="yellow" value={stats?.entregas_pendientes ?? 'â€”'} label="Entregas por calificar" />
                </div>

                {/* PrÃ³xima clase */}
                {proximaClase && (
                  <div className="ts-next-class">
                    <div className="ts-next-class-icon"><i className="fas fa-video"></i></div>
                    <div className="ts-next-class-info">
                      <h3>{proximaClase.titulo}</h3>
                      <p><i className="fas fa-calendar"></i> {formatFecha(proximaClase.fecha)} â€” {proximaClase.hora?.slice(0,5)}</p>
                      <p><i className="fas fa-desktop"></i> {proximaClase.plataforma} Â· {proximaClase.duracion} min</p>
                    </div>
                    <a href={proximaClase.enlace} target="_blank" rel="noreferrer" className="ts-next-class-link">
                      <i className="fas fa-external-link-alt"></i> Unirse
                    </a>
                  </div>
                )}

                {/* Ãšltimas entregas */}
                <div className="ts-section">
                  <div className="ts-section-header">
                    <span className="ts-section-title"><i className="fas fa-inbox"></i> Ãšltimas Entregas</span>
                  </div>
                  <div className="ts-section-body">
                    {ultimasEntregas.length === 0 ? (
                      <EmptyState icon="fa-inbox" title="Sin entregas aÃºn" text="Los estudiantes aÃºn no han entregado actividades." />
                    ) : ultimasEntregas.map((e) => (
                      <div key={e.id} className="ts-entrega-card pendiente" style={{ marginBottom: 12 }}>
                        <div className="ts-entrega-header">
                          <div className="ts-entrega-student">
                            <i className="fas fa-user-graduate"></i>
                            {e.estudiante?.name || 'Estudiante'}
                          </div>
                          <span className="ts-badge pending"><i className="fas fa-clock"></i> Pendiente</span>
                        </div>
                        <div className="ts-entrega-body">
                          <small style={{ color: 'var(--gray)' }}>
                            Actividad: <strong>{e.actividad?.titulo}</strong> â€” {formatFecha(e.created_at)}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* â”€â”€â”€ ACTIVIDADES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {seccion === 'actividades' && (
          <>
            <div className="ts-page-header">
              <h1 className="ts-page-title">GestiÃ³n de <span>Actividades</span></h1>
              <button className="ts-btn ts-btn-primary" onClick={() => { resetFormActividad(); setModalActividad(true); }}>
                <i className="fas fa-plus"></i> Nueva Actividad
              </button>
            </div>

            {/* Filtros */}
            <div className="ts-filter-tabs">
              {['todas', 'pendientes', 'vencidas', 'calificadas'].map((f) => (
                <button key={f} className={`ts-filter-tab ${filtro === f ? 'active' : ''}`} onClick={() => setFiltro(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {loading ? <Spinner /> : actividades.length === 0 ? (
              <EmptyState icon="fa-tasks" title="Sin actividades" text="Crea tu primera actividad para los estudiantes." />
            ) : actividades.map((act) => (
              <div key={act.id} className="ts-activity-card">
                <div className="ts-activity-card-header">
                  <div className="ts-activity-tipo">
                    <i className={`fas ${iconoTipo(act.tipo)}`}></i>
                    {act.tipo}
                  </div>
                  <div className="ts-activity-date">
                    <i className="fas fa-calendar"></i> LÃ­mite: {formatFecha(act.fecha_limite)}
                  </div>
                </div>
                <div className="ts-activity-card-body">
                  <div className="ts-activity-title">{act.titulo}</div>
                  <div className="ts-activity-desc">{act.descripcion || 'Sin descripciÃ³n.'}</div>
                  <div className="ts-activity-meta">
                    <span><i className="fas fa-star"></i> Puntaje: {act.puntaje}</span>
                    <span><i className="fas fa-inbox"></i> {act.total_entregas} entregas</span>
                    {act.entregas_pendientes > 0 && (
                      <span className="ts-badge pending"><i className="fas fa-clock"></i> {act.entregas_pendientes} por calificar</span>
                    )}
                    {act.entregas_calificadas > 0 && (
                      <span className="ts-badge graded"><i className="fas fa-check"></i> {act.entregas_calificadas} calificadas</span>
                    )}
                  </div>
                </div>
                <div className="ts-activity-card-footer">
                  <button className="ts-btn ts-btn-info ts-btn-sm" onClick={() => abrirEntregas(act)}>
                    <i className="fas fa-graduation-cap"></i> Calificar Entregas
                  </button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="ts-btn ts-btn-secondary ts-btn-sm" onClick={() => {
                      setFormActividad({ ...act, archivos: [] });
                      setEditando(act.id);
                      setModalActividad(true);
                    }}>
                      <i className="fas fa-edit"></i> Editar
                    </button>
                    <button className="ts-btn ts-btn-danger ts-btn-sm" onClick={() => eliminarActividad(act.id)}>
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* â”€â”€â”€ AULA VIRTUAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {seccion === 'clases' && (
          <>
            <div className="ts-page-header">
              <h1 className="ts-page-title">Aula <span>Virtual</span></h1>
              <button className="ts-btn ts-btn-primary" onClick={() => { resetFormClase(); setModalClase(true); }}>
                <i className="fas fa-plus"></i> Nueva Clase
              </button>
            </div>

            {loading ? <Spinner /> : clases.length === 0 ? (
              <EmptyState icon="fa-video" title="Sin clases programadas" text="Programa tu primera sesiÃ³n virtual para los estudiantes." />
            ) : (
              <div className="ts-section">
                <div className="ts-section-body">
                  {clases.map((c) => (
                    <div key={c.id} className="ts-activity-card">
                      <div className="ts-activity-card-header">
                        <div className="ts-activity-tipo"><i className="fas fa-video"></i> {c.plataforma}</div>
                        <div className="ts-activity-date"><i className="fas fa-calendar"></i> {formatFecha(c.fecha)} â€” {c.hora?.slice(0,5)}</div>
                      </div>
                      <div className="ts-activity-card-body">
                        <div className="ts-activity-title">{c.titulo}</div>
                        <div className="ts-activity-desc">{c.descripcion || 'Sin descripciÃ³n.'}</div>
                        <div className="ts-activity-meta">
                          <span><i className="fas fa-clock"></i> {c.duracion} minutos</span>
                          <a href={c.enlace} target="_blank" rel="noreferrer" style={{ color: 'var(--info)', fontWeight: 600 }}>
                            <i className="fas fa-link"></i> Enlace de acceso
                          </a>
                        </div>
                      </div>
                      <div className="ts-activity-card-footer">
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="ts-btn ts-btn-secondary ts-btn-sm" onClick={() => { setFormClase(c); setEditando(c.id); setModalClase(true); }}>
                            <i className="fas fa-edit"></i> Editar
                          </button>
                          <button className="ts-btn ts-btn-danger ts-btn-sm" onClick={() => eliminarClase(c.id)}>
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* â”€â”€â”€ MATERIAL DE APOYO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {seccion === 'materiales' && (
          <>
            <div className="ts-page-header">
              <h1 className="ts-page-title">Material de <span>Apoyo</span></h1>
              <button className="ts-btn ts-btn-primary" onClick={() => setModalMaterial(true)}>
                <i className="fas fa-plus"></i> Nuevo Material
              </button>
            </div>

            {loading ? <Spinner /> : materiales.length === 0 ? (
              <EmptyState icon="fa-book-open" title="Sin materiales" text="Sube documentos, videos o guÃ­as para tus estudiantes." />
            ) : (
              <div className="ts-section">
                <div className="ts-section-body">
                  {materiales.map((m) => (
                    <div key={m.id} className="ts-activity-card">
                      <div className="ts-activity-card-header">
                        <div className="ts-activity-tipo">
                          <i className={`fas ${m.tipo === 'video' ? 'fa-play-circle' : 'fa-file-alt'}`}></i>
                          {m.tipo}
                        </div>
                        <div className="ts-activity-date"><i className="fas fa-calendar"></i> {formatFecha(m.created_at)}</div>
                      </div>
                      <div className="ts-activity-card-body">
                        <div className="ts-activity-title">{m.titulo}</div>
                        <div className="ts-activity-desc">{m.descripcion || 'Sin descripciÃ³n.'}</div>
                        {m.archivos?.length > 0 && (
                          <div className="ts-activity-meta">
                            {m.archivos.map((a) => (
                              <a key={a.id} href={`http://localhost:8000/storage/${a.ruta_archivo}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                                <i className="fas fa-paperclip"></i> {a.nombre_archivo}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="ts-activity-card-footer">
                        <button className="ts-btn ts-btn-danger ts-btn-sm" onClick={() => eliminarMaterial(m.id)}>
                          <i className="fas fa-trash"></i> Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* â•â•â• MODAL: Nueva/Editar Actividad â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {modalActividad && (
        <div className="ts-modal-overlay" onClick={() => setModalActividad(false)}>
          <div className="ts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ts-modal-header">
              <h2><i className="fas fa-tasks"></i> {editando ? 'Editar' : 'Nueva'} Actividad</h2>
              <button className="ts-modal-close" onClick={() => setModalActividad(false)}>Ã—</button>
            </div>
            <form onSubmit={submitActividad}>
              <div className="ts-modal-body">
                <div className="ts-form-grid">
                  <div className="ts-form-field full">
                    <label>TÃ­tulo *</label>
                    <input required value={formActividad.titulo} onChange={(e) => setFormActividad({ ...formActividad, titulo: e.target.value })} placeholder="Ej: DiseÃ±o de Base de Datos" />
                  </div>
                  <div className="ts-form-field full">
                    <label>DescripciÃ³n</label>
                    <textarea rows={3} value={formActividad.descripcion} onChange={(e) => setFormActividad({ ...formActividad, descripcion: e.target.value })} placeholder="Instrucciones detalladas..." />
                  </div>
                  <div className="ts-form-field">
                    <label>Tipo *</label>
                    <select value={formActividad.tipo} onChange={(e) => setFormActividad({ ...formActividad, tipo: e.target.value })}>
                      <option value="tarea">Tarea</option>
                      <option value="proyecto">Proyecto</option>
                      <option value="examen">Examen</option>
                      <option value="cuestionario">Cuestionario</option>
                      <option value="investigacion">InvestigaciÃ³n</option>
                    </select>
                  </div>
                  <div className="ts-form-field">
                    <label>Puntaje mÃ¡ximo (0â€“5) *</label>
                    <input type="number" min="0" max="5" step="0.5" value={formActividad.puntaje} onChange={(e) => setFormActividad({ ...formActividad, puntaje: e.target.value })} />
                  </div>
                  <div className="ts-form-field">
                    <label>Fecha lÃ­mite *</label>
                    <input type="date" required value={formActividad.fecha_limite} onChange={(e) => setFormActividad({ ...formActividad, fecha_limite: e.target.value })} />
                  </div>
                  <div className="ts-form-field">
                    <label>Hora lÃ­mite *</label>
                    <input type="time" required value={formActividad.hora_limite} onChange={(e) => setFormActividad({ ...formActividad, hora_limite: e.target.value })} />
                  </div>
                  <div className="ts-form-field full" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" id="entregas_tarde" checked={formActividad.permitir_entregas_tarde} onChange={(e) => setFormActividad({ ...formActividad, permitir_entregas_tarde: e.target.checked })} style={{ width: 'auto' }} />
                    <label htmlFor="entregas_tarde" style={{ marginBottom: 0 }}>Permitir entregas tardÃ­as</label>
                  </div>
                  <div className="ts-form-field full">
                    <label>Archivos adjuntos (enunciado)</label>
                    <input type="file" multiple onChange={(e) => setFormActividad({ ...formActividad, archivos: Array.from(e.target.files) })} />
                  </div>
                </div>
              </div>
              <div className="ts-modal-footer">
                <button type="button" className="ts-btn ts-btn-secondary" onClick={() => setModalActividad(false)}>Cancelar</button>
                <button type="submit" className="ts-btn ts-btn-primary"><i className="fas fa-save"></i> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* â•â•â• MODAL: Calificar Entregas â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {entregasModal !== null && (
        <div className="ts-modal-overlay" onClick={() => setEntregasModal(null)}>
          <div className="ts-modal" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
            <div className="ts-modal-header">
              <h2><i className="fas fa-graduation-cap"></i> Entregas â€” {actividadModal?.titulo}</h2>
              <button className="ts-modal-close" onClick={() => setEntregasModal(null)}>Ã—</button>
            </div>
            <div className="ts-modal-body">
              {entregasModal.length === 0 ? (
                <EmptyState icon="fa-inbox" title="Sin entregas" text="NingÃºn estudiante ha entregado esta actividad aÃºn." />
              ) : entregasModal.map((e) => (
                <div key={e.id} className={`ts-entrega-card ${e.estado}`}>
                  <div className="ts-entrega-header">
                    <div className="ts-entrega-student">
                      <i className="fas fa-user-graduate"></i>
                      {e.estudiante?.name || 'Estudiante'}
                      <small style={{ color: 'var(--gray)', fontWeight: 400 }}>â€” {e.estudiante?.email}</small>
                    </div>
                    <span className={`ts-badge ${e.estado === 'calificado' ? 'graded' : 'pending'}`}>
                      {e.estado === 'calificado' ? `âœ“ ${e.calificacion}/5` : 'Pendiente'}
                    </span>
                  </div>
                  <div className="ts-entrega-body">
                    {e.comentario && <p style={{ marginBottom: 8, fontSize: '0.9rem' }}><strong>Comentario:</strong> {e.comentario}</p>}
                    {e.archivos?.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        {e.archivos.map((a) => (
                          <a key={a.id} href={`http://localhost:8000/storage/${a.ruta_archivo}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--info)', marginRight: 10 }}>
                            <i className="fas fa-download"></i> {a.nombre_archivo}
                          </a>
                        ))}
                      </div>
                    )}
                    {e.estado !== 'calificado' && (
                      <div className="ts-calificacion-form">
                        <input
                          type="number" min="0" max="5" step="0.1"
                          placeholder="Nota (0â€“5)"
                          value={calificaciones[e.id]?.nota || ''}
                          onChange={(ev) => setCalificaciones({ ...calificaciones, [e.id]: { ...calificaciones[e.id], nota: ev.target.value } })}
                        />
                        <input
                          type="text" placeholder="RetroalimentaciÃ³n..."
                          style={{ flex: 1, padding: '8px 12px', border: '2px solid var(--gray-border)', borderRadius: 'var(--radius)' }}
                          value={calificaciones[e.id]?.comentario || ''}
                          onChange={(ev) => setCalificaciones({ ...calificaciones, [e.id]: { ...calificaciones[e.id], comentario: ev.target.value } })}
                        />
                        <button className="ts-btn ts-btn-primary ts-btn-sm" onClick={() => calificarEntrega(e.id)}>
                          <i className="fas fa-check"></i> Calificar
                        </button>
                      </div>
                    )}
                    {e.estado === 'calificado' && e.comentario_tutor && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: 8 }}>
                        <i className="fas fa-comment"></i> RetroalimentaciÃ³n: {e.comentario_tutor}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* â•â•â• MODAL: Nueva Clase Virtual â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {modalClase && (
        <div className="ts-modal-overlay" onClick={() => setModalClase(false)}>
          <div className="ts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ts-modal-header">
              <h2><i className="fas fa-video"></i> {editando ? 'Editar' : 'Nueva'} Clase Virtual</h2>
              <button className="ts-modal-close" onClick={() => setModalClase(false)}>Ã—</button>
            </div>
            <form onSubmit={submitClase}>
              <div className="ts-modal-body">
                <div className="ts-form-grid">
                  <div className="ts-form-field full">
                    <label>TÃ­tulo *</label>
                    <input required value={formClase.titulo} onChange={(e) => setFormClase({ ...formClase, titulo: e.target.value })} />
                  </div>
                  <div className="ts-form-field full">
                    <label>DescripciÃ³n</label>
                    <textarea rows={2} value={formClase.descripcion} onChange={(e) => setFormClase({ ...formClase, descripcion: e.target.value })} />
                  </div>
                  <div className="ts-form-field">
                    <label>Fecha *</label>
                    <input type="date" required value={formClase.fecha} onChange={(e) => setFormClase({ ...formClase, fecha: e.target.value })} />
                  </div>
                  <div className="ts-form-field">
                    <label>Hora *</label>
                    <input type="time" required value={formClase.hora} onChange={(e) => setFormClase({ ...formClase, hora: e.target.value })} />
                  </div>
                  <div className="ts-form-field">
                    <label>DuraciÃ³n (minutos) *</label>
                    <input type="number" min="15" value={formClase.duracion} onChange={(e) => setFormClase({ ...formClase, duracion: e.target.value })} />
                  </div>
                  <div className="ts-form-field">
                    <label>Plataforma *</label>
                    <select value={formClase.plataforma} onChange={(e) => setFormClase({ ...formClase, plataforma: e.target.value })}>
                      {['Zoom', 'Google Meet', 'Microsoft Teams', 'Otra'].map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="ts-form-field full">
                    <label>Enlace de acceso *</label>
                    <input type="url" required value={formClase.enlace} onChange={(e) => setFormClase({ ...formClase, enlace: e.target.value })} placeholder="https://..." />
                  </div>
                </div>
              </div>
              <div className="ts-modal-footer">
                <button type="button" className="ts-btn ts-btn-secondary" onClick={() => setModalClase(false)}>Cancelar</button>
                <button type="submit" className="ts-btn ts-btn-primary"><i className="fas fa-save"></i> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* â•â•â• MODAL: Nuevo Material â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {modalMaterial && (
        <div className="ts-modal-overlay" onClick={() => setModalMaterial(false)}>
          <div className="ts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ts-modal-header">
              <h2><i className="fas fa-book-open"></i> Nuevo Material de Apoyo</h2>
              <button className="ts-modal-close" onClick={() => setModalMaterial(false)}>Ã—</button>
            </div>
            <form onSubmit={submitMaterial}>
              <div className="ts-modal-body">
                <div className="ts-form-grid">
                  <div className="ts-form-field full">
                    <label>TÃ­tulo *</label>
                    <input required value={formMaterial.titulo} onChange={(e) => setFormMaterial({ ...formMaterial, titulo: e.target.value })} />
                  </div>
                  <div className="ts-form-field full">
                    <label>DescripciÃ³n</label>
                    <textarea rows={2} value={formMaterial.descripcion} onChange={(e) => setFormMaterial({ ...formMaterial, descripcion: e.target.value })} />
                  </div>
                  <div className="ts-form-field">
                    <label>Tipo *</label>
                    <select value={formMaterial.tipo} onChange={(e) => setFormMaterial({ ...formMaterial, tipo: e.target.value })}>
                      <option value="documento">Documento</option>
                      <option value="video">Video</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div className="ts-form-field full">
                    <label>Archivos *</label>
                    <input type="file" multiple onChange={(e) => setFormMaterial({ ...formMaterial, archivos: Array.from(e.target.files) })} />
                  </div>
                </div>
              </div>
              <div className="ts-modal-footer">
                <button type="button" className="ts-btn ts-btn-secondary" onClick={() => setModalMaterial(false)}>Cancelar</button>
                <button type="submit" className="ts-btn ts-btn-primary"><i className="fas fa-cloud-upload-alt"></i> Subir</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Sub-componentes reutilizables
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatCard({ icon, color, value, label }) {
  return (
    <div className="ts-stat-card">
      <div className={`ts-stat-icon ${color}`}><i className={`fas ${icon}`}></i></div>
      <div>
        <div className="ts-stat-value">{value}</div>
        <div className="ts-stat-label">{label}</div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="ts-loading">
      <div className="ts-spinner"></div>
      <span>Cargando...</span>
    </div>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <div className="ts-empty-state">
      <i className={`fas ${icon}`}></i>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

