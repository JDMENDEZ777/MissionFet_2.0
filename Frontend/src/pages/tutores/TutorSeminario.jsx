import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './TutorSeminario.css';

export default function TutorSeminario() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState({ text: '', type: '' });

  // Datos principales
  const [seminario, setSeminario] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [stats, setStats] = useState({ total_estudiantes: 0, total_actividades: 0, total_recursos: 0 });

  // Pestaña activa
  const [activeTab, setActiveTab] = useState('inicio');

  // Modales y control de formularios
  const [modalEnlace, setModalEnlace] = useState(false);
  const [nuevoEnlace, setNuevoEnlace] = useState('');

  const [modalActividad, setModalActividad] = useState(false);
  const [actividadEditar, setActividadEditar] = useState(null);
  const [formActividad, setFormActividad] = useState({
    titulo: '',
    descripcion: '',
    puntaje: 5.0,
    fecha_limite: '',
    hora_limite: '23:59',
    permite_entregas_tardias: false
  });

  // Control de sub-vista de calificaciones de una actividad
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [entregasActividad, setEntregasActividad] = useState([]);
  const [filtroEntrega, setFiltroEntrega] = useState('todos'); // todos, entregados, calificados, pendientes

  // Modal para calificar entrega
  const [modalCalificar, setModalCalificar] = useState(false);
  const [entregaSeleccionada, setEntregaSeleccionada] = useState(null);
  const [formCalificacion, setFormCalificacion] = useState({
    nota: '',
    comentario_tutor: ''
  });

  // Modal de recursos
  const [modalRecurso, setModalRecurso] = useState(false);
  const [formRecurso, setFormRecurso] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'archivo',
    archivo: null,
    url: ''
  });

  useEffect(() => {
    fetchDatosIniciales();
  }, []);

  const fetchDatosIniciales = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/tutor/seminario');
      if (response.data.success) {
        setSeminario(response.data.seminario);
        setEstudiantes(response.data.estudiantes || []);
        setStats(response.data.stats || { total_estudiantes: 0, total_actividades: 0, total_recursos: 0 });
        if (response.data.seminario) {
          setNuevoEnlace(response.data.seminario.lugar || '');
          await fetchActividades();
          await fetchRecursos();
        }
      }
    } catch (err) {
      console.error(err);
      setError('Error al cargar la información del seminario.');
    } finally {
      setLoading(false);
    }
  };

  const fetchActividades = async () => {
    try {
      const res = await api.get('/tutor/seminario/actividades');
      if (res.data.success) {
        setActividades(res.data.actividades || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecursos = async () => {
    try {
      const res = await api.get('/tutor/seminario/recursos');
      if (res.data.success) {
        setRecursos(res.data.recursos || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const mostrarAlerta = (text, type) => {
    setMensaje({ text, type });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setMensaje({ text: '', type: '' }), 5000);
  };

  // MANEJO DE ENLACE VIRTUAL
  const handleUpdateEnlace = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/tutor/seminario/enlace', { enlace: nuevoEnlace });
      if (res.data.success) {
        setSeminario({ ...seminario, lugar: res.data.lugar });
        mostrarAlerta('Enlace de videollamada actualizado exitosamente.', 'success');
        setModalEnlace(false);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al actualizar el enlace.';
      mostrarAlerta(msg, 'error');
    }
  };

  // MANEJO DE ACTIVIDADES
  const abrirCrearActividad = () => {
    setActividadEditar(null);
    setFormActividad({
      titulo: '',
      descripcion: '',
      puntaje: 5.0,
      fecha_limite: '',
      hora_limite: '23:59',
      permite_entregas_tardias: false
    });
    setModalActividad(true);
  };

  const abrirEditarActividad = (act) => {
    setActividadEditar(act);
    setFormActividad({
      titulo: act.titulo,
      descripcion: act.descripcion || '',
      puntaje: act.puntaje,
      fecha_limite: act.fecha_limite,
      hora_limite: act.hora_limite.substring(0, 5),
      permite_entregas_tardias: !!act.permite_entregas_tardias
    });
    setModalActividad(true);
  };

  const handleGuardarActividad = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (actividadEditar) {
        res = await api.put(`/tutor/seminario/actividades/${actividadEditar.id}`, formActividad);
      } else {
        res = await api.post('/tutor/seminario/actividades', formActividad);
      }

      if (res.data.success) {
        mostrarAlerta(actividadEditar ? 'Actividad modificada correctamente.' : 'Actividad creada con éxito.', 'success');
        setModalActividad(false);
        fetchActividades();
        fetchDatosIniciales(); // Recargar contador de stats
      }
    } catch (err) {
      mostrarAlerta('Error al guardar la actividad. Verifique los campos.', 'error');
    }
  };

  const handleEliminarActividad = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta actividad? Se perderán todas las entregas asociadas.')) return;
    try {
      const res = await api.delete(`/tutor/seminario/actividades/${id}`);
      if (res.data.success) {
        mostrarAlerta('Actividad eliminada correctamente.', 'success');
        fetchActividades();
        fetchDatosIniciales();
        if (actividadSeleccionada?.id === id) {
          setActividadSeleccionada(null);
        }
      }
    } catch (err) {
      mostrarAlerta('Error al eliminar la actividad.', 'error');
    }
  };

  // MANEJO DE VISTA DE ENTREGAS
  const verEntregasActividad = async (act) => {
    setActividadSeleccionada(act);
    setLoading(true);
    try {
      const res = await api.get(`/tutor/seminario/actividades/${act.id}/entregas`);
      if (res.data.success) {
        setEntregasActividad(res.data.entregas || []);
      }
    } catch (err) {
      mostrarAlerta('Error al cargar las entregas.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // MANEJO DE CALIFICACIÓN
  const abrirCalificar = (entrega) => {
    setEntregaSeleccionada(entrega);
    setFormCalificacion({
      nota: entrega.nota !== null ? entrega.nota : '',
      comentario_tutor: entrega.comentario_tutor || ''
    });
    setModalCalificar(true);
  };

  const handleCalificarEntrega = async (e) => {
    e.preventDefault();
    if (!entregaSeleccionada?.entrega_id) {
      mostrarAlerta('El estudiante aún no ha cargado una entrega para esta actividad.', 'error');
      return;
    }

    try {
      const res = await api.post(`/tutor/seminario/entregas/${entregaSeleccionada.entrega_id}/calificar`, formCalificacion);
      if (res.data.success) {
        mostrarAlerta('Entrega calificada exitosamente.', 'success');
        setModalCalificar(false);
        // Refrescar lista de entregas y estudiantes
        verEntregasActividad(actividadSeleccionada);
        fetchDatosIniciales();
      }
    } catch (err) {
      mostrarAlerta('Error al calificar la entrega. El puntaje debe ser entre 0.0 y 5.0.', 'error');
    }
  };

  // MANEJO DE MATERIAL DE APOYO (RECURSOS)
  const handleGuardarRecurso = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('titulo', formRecurso.titulo);
    formData.append('descripcion', formRecurso.descripcion);
    formData.append('tipo', formRecurso.tipo);

    if (formRecurso.tipo === 'archivo' && formRecurso.archivo) {
      formData.append('archivo', formRecurso.archivo);
    } else if (formRecurso.tipo === 'enlace') {
      formData.append('url', formRecurso.url);
    }

    try {
      const res = await api.post('/tutor/seminario/recursos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        mostrarAlerta('Material de apoyo publicado correctamente.', 'success');
        setModalRecurso(false);
        setFormRecurso({ titulo: '', descripcion: '', tipo: 'archivo', archivo: null, url: '' });
        fetchRecursos();
        fetchDatosIniciales();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al subir el material.';
      mostrarAlerta(msg, 'error');
    }
  };

  const handleEliminarRecurso = async (id) => {
    if (!window.confirm('¿Desea eliminar este material de apoyo?')) return;
    try {
      const res = await api.delete(`/tutor/seminario/recursos/${id}`);
      if (res.data.success) {
        mostrarAlerta('Material de apoyo eliminado.', 'success');
        fetchRecursos();
        fetchDatosIniciales();
      }
    } catch (err) {
      mostrarAlerta('Error al eliminar el material.', 'error');
    }
  };

  // FILTRADO DE ENTREGAS
  const entregasFiltradas = entregasActividad.filter(ent => {
    if (filtroEntrega === 'todos') return true;
    if (filtroEntrega === 'entregados') return ent.entrega_id !== null && ent.estado !== 'calificado';
    if (filtroEntrega === 'calificados') return ent.estado === 'calificado';
    if (filtroEntrega === 'pendientes') return ent.entrega_id === null;
    return true;
  });

  if (loading && !seminario) {
    return (
      <div className="tutor-seminario-loading">
        <div className="spinner"></div>
        <p>Cargando Aula Virtual del Seminario...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tutor-seminario-error">
        <i className="fas fa-exclamation-triangle"></i>
        <h2>Portal No Disponible</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/tutor/dashboard')} className="btn-retroceder">
          <i className="fas fa-arrow-left"></i> Volver al Portal
        </button>
      </div>
    );
  }

  if (!seminario) {
    return (
      <div className="tutor-seminario-error">
        <i className="fas fa-lock"></i>
        <h2>Acceso Denegado</h2>
        <p>Actualmente no tiene asignado ningún Seminario de Grado activo en el sistema.</p>
        <button onClick={() => navigate('/tutor/dashboard')} className="btn-retroceder">
          <i className="fas fa-arrow-left"></i> Volver al Portal
        </button>
      </div>
    );
  }

  return (
    <div className="tutor-seminario-container">
      {/* Header Principal */}
      <header className="ts-header">
        <div className="ts-header-left">
          <img src="/IMG/logofet.png" alt="FET Logo" className="ts-logo" />
          <div className="ts-title-wrapper">
            <span className="badge-modalidad">{seminario.modalidad.toUpperCase()}</span>
            <h1>Aula Virtual: {seminario.titulo}</h1>
          </div>
        </div>
        <button onClick={() => navigate('/tutor/dashboard')} className="btn-back">
          <i className="fas fa-arrow-left"></i> Panel de Control
        </button>
      </header>

      {/* Alertas */}
      {mensaje.text && (
        <div className={`ts-alert ts-alert-${mensaje.type}`}>
          <i className={mensaje.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}></i>
          <span>{mensaje.text}</span>
        </div>
      )}

      {/* Widget Enlace Fijo Superior */}
      {seminario.modalidad === 'virtual' && (
        <div className="meet-widget-card">
          <div className="meet-widget-left">
            <div className="meet-icon-wrapper">
              <i className="fas fa-video"></i>
            </div>
            <div className="meet-details">
              <h3>Enlace de Videollamada FET</h3>
              <p className="meet-hint">Utilizado para las sesiones en vivo y asesorías</p>
              {seminario.lugar ? (
                <a href={seminario.lugar} target="_blank" rel="noreferrer" className="meet-link-url">
                  {seminario.lugar} <i className="fas fa-external-link-alt"></i>
                </a>
              ) : (
                <span className="meet-no-link">No se ha configurado el enlace aún</span>
              )}
            </div>
          </div>
          <button onClick={() => setModalEnlace(true)} className="btn-edit-meet">
            <i className="fas fa-link"></i> {seminario.lugar ? 'Modificar Link' : 'Configurar Link'}
          </button>
        </div>
      )}

      {/* Navegación por Pestañas */}
      <nav className="ts-tabs-navigation">
        <button className={`tab-btn ${activeTab === 'inicio' ? 'active' : ''}`} onClick={() => { setActiveTab('inicio'); setActividadSeleccionada(null); }}>
          <i className="fas fa-info-circle"></i> Información y Estudiantes
        </button>
        <button className={`tab-btn ${activeTab === 'actividades' ? 'active' : ''}`} onClick={() => setActiveTab('actividades')}>
          <i className="fas fa-tasks"></i> Actividades del Curso
        </button>
        <button className={`tab-btn ${activeTab === 'recursos' ? 'active' : ''}`} onClick={() => { setActiveTab('recursos'); setActividadSeleccionada(null); }}>
          <i className="fas fa-folder-open"></i> Material de Apoyo
        </button>
      </nav>
      <main className="ts-main-content">

        {/* PESTAÑA 1: INICIO Y ALUMNOS */}
        {activeTab === 'inicio' && (
          <section className="tab-pane-content animate-fade-in">
            <div className="ts-grid-two-cols">
              {/* Columna Izquierda: Información General */}
              <div className="ts-info-card">
                <h2>Información del Seminario</h2>
                <div className="ts-info-details">
                  <p><strong>Descripción:</strong></p>
                  <p className="desc-text">{seminario.descripcion}</p>
                  <div className="info-meta-grid">
                    <div className="meta-box">
                      <span className="meta-label">Fecha del Seminario</span>
                      <span className="meta-value"><i className="far fa-calendar-alt"></i> {seminario.fecha}</span>
                    </div>
                    <div className="meta-box">
                      <span className="meta-label">Hora del Seminario</span>
                      <span className="meta-value"><i className="far fa-clock"></i> {seminario.hora}</span>
                    </div>
                    <div className="meta-box">
                      <span className="meta-label">Modalidad</span>
                      <span className="meta-value"><i className="fas fa-laptop-house"></i> {seminario.modalidad.toUpperCase()}</span>
                    </div>
                    <div className="meta-box">
                      <span className="meta-label">Estado</span>
                      <span className="meta-value badge-estado-seminario"><i className="fas fa-circle"></i> {seminario.estado.toUpperCase()}</span>
                    </div>
                  </div>
                  {seminario.archivo_guia && (
                    <div className="guia-download-card">
                      <div className="guia-icon">
                        <i className="fas fa-file-pdf"></i>
                      </div>
                      <div className="guia-info">
                        <h4>Guía General del Seminario</h4>
                        <p>Documento de referencia cargado por el Administrador</p>
                      </div>
                      <a href={`http://localhost:8000/storage/seminarios/${seminario.archivo_guia}`} target="_blank" rel="noreferrer" className="btn-download-guia">
                        Ver Guía
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Columna Derecha: Tarjetas de Estadísticas Rápidas */}
              <div className="ts-stats-sidebar">
                <div className="stats-mini-card">
                  <div className="stat-icon-circle green-bg">
                    <i className="fas fa-user-friends"></i>
                  </div>
                  <div className="stat-info-text">
                    <h3>{stats.total_estudiantes}</h3>
                    <p>Estudiantes Matriculados</p>
                  </div>
                </div>
                <div className="stats-mini-card">
                  <div className="stat-icon-circle blue-bg">
                    <i className="fas fa-file-invoice"></i>
                  </div>
                  <div className="stat-info-text">
                    <h3>{stats.total_actividades}</h3>
                    <p>Actividades Asignadas</p>
                  </div>
                </div>
                <div className="stats-mini-card">
                  <div className="stat-icon-circle purple-bg">
                    <i className="fas fa-folder"></i>
                  </div>
                  <div className="stat-info-text">
                    <h3>{stats.total_recursos}</h3>
                    <p>Materiales de Apoyo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Listado de Estudiantes */}
            <div className="students-section-card">
              <div className="students-section-header">
                <h2>Estudiantes Matriculados ({estudiantes.length})</h2>
                <p>Lista oficial de inscritos y su desempeño acumulado</p>
              </div>
              <div className="table-responsive-wrapper">
                {estudiantes.length === 0 ? (
                  <div className="no-data-card">
                    <i className="fas fa-users-slash"></i>
                    <p>No hay estudiantes matriculados en este seminario todavía.</p>
                  </div>
                ) : (
                  <table className="ts-students-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Nombre Completo</th>
                        <th>Identificación</th>
                        <th>Email de Contacto</th>
                        <th>Nota Acumulada</th>
                        <th>Estado Académico</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estudiantes.map(est => (
                        <tr key={est.id}>
                          <td className="font-bold">{est.codigo || 'S/C'}</td>
                          <td className="student-name-cell">
                            <div className="avatar-letter">{est.nombre.charAt(0)}</div>
                            <span>{est.nombre}</span>
                          </td>
                          <td>{est.documento || 'S/D'}</td>
                          <td>{est.email}</td>
                          <td>
                            {est.nota_promedio !== null ? (
                              <span className={`promedio-badge ${est.nota_promedio >= 3.0 ? 'pass' : 'fail'}`}>
                                {est.nota_promedio} / 5.0
                              </span>
                            ) : (
                              <span className="promedio-badge pending">Sin Entregas</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge-inscrito-estado ${est.estado}`}>
                              {est.estado.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>
        )}

        {/* PESTAÑA 2: LMS ACTIVIDADES */}
        {activeTab === 'actividades' && (
          <section className="tab-pane-content animate-fade-in">
            {!actividadSeleccionada ? (
              <>
                <div className="tab-pane-header">
                  <div className="pane-title-details">
                    <h2>Actividades y Tareas Académicas</h2>
                    <p>Asigne entregas a sus alumnos y controle los tiempos de entrega y notas</p>
                  </div>
                  <button onClick={abrirCrearActividad} className="btn-add-activity">
                    <i className="fas fa-plus"></i> Crear Nueva Actividad
                  </button>
                </div>

                {actividades.length === 0 ? (
                  <div className="no-data-card margin-top-30">
                    <i className="fas fa-tasks"></i>
                    <h3>Sin Actividades Creadas</h3>
                    <p>Empiece creando su primera actividad para que los estudiantes puedan cargar sus tareas.</p>
                    <button onClick={abrirCrearActividad} className="btn-add-activity margin-top-15">
                      Crear Primera Actividad
                    </button>
                  </div>
                ) : (
                  <div className="activities-grid">
                    {actividades.map(act => {
                      const total_alumnos = estudiantes.length;
                      const porc_avance = total_alumnos > 0 ? Math.round((act.total_entregas / total_alumnos) * 100) : 0;

                      return (
                        <div key={act.id} className="activity-premium-card">
                          <div className="activity-card-header">
                            <span className="badge-max-grade">Nota Máx: {act.puntaje}</span>
                            <h3>{act.titulo}</h3>
                          </div>
                          <div className="activity-card-body">
                            <p className="activity-description">{act.descripcion || 'Sin descripción detallada.'}</p>

                            <div className="activity-deadlines">
                              <p>
                                <i className="far fa-calendar-alt"></i> <strong>Fecha Límite:</strong> {act.fecha_limite}
                              </p>
                              <p>
                                <i className="far fa-clock"></i> <strong>Hora Límite:</strong> {act.hora_limite}
                              </p>
                              <p>
                                <i className="fas fa-history"></i> <strong>Entregas Tardías:</strong> {act.permite_entregas_tardias ? 'Permitido' : 'No Permitido'}
                              </p>
                            </div>

                            {/* Barra de progreso de entregas */}
                            <div className="activity-progress-wrapper">
                              <div className="progress-labels">
                                <span>Entregas cargadas</span>
                                <span>{act.total_entregas} / {total_alumnos}</span>
                              </div>
                              <div className="progress-bar-container">
                                <div className="progress-bar-fill" style={{ width: `${porc_avance}%` }}></div>
                              </div>
                              <span className="graded-summary-hint">
                                <i className="fas fa-check-double"></i> Calificadas: {act.entregas_calificadas} de {act.total_entregas}
                              </span>
                            </div>
                          </div>
                          <div className="activity-card-footer">
                            <button onClick={() => verEntregasActividad(act)} className="btn-ver-entregas">
                              <i className="fas fa-clipboard-check"></i> Calificar / Ver Entregas
                            </button>
                            <div className="activity-action-options">
                              <button onClick={() => abrirEditarActividad(act)} className="btn-icon-edit" title="Editar">
                                <i className="fas fa-edit"></i>
                              </button>
                              <button onClick={() => handleEliminarActividad(act.id)} className="btn-icon-delete" title="Eliminar">
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              /* SUBVISTA DE ENTREGAS PARA UNA ACTIVIDAD ESPECÍFICA */
              <div className="grading-submissions-pane animate-fade-in">
                <div className="grading-pane-header">
                  <button onClick={() => setActividadSeleccionada(null)} className="btn-back-to-activities">
                    <i className="fas fa-arrow-left"></i> Volver a Actividades
                  </button>
                  <div className="grading-pane-details">
                    <span className="badge-light">Actividad Seleccionada</span>
                    <h2>{actividadSeleccionada.titulo}</h2>
                    <p className="grading-deadline-info">
                      <i className="far fa-calendar-alt"></i> Entrega límite: {actividadSeleccionada.fecha_limite} a las {actividadSeleccionada.hora_limite}
                    </p>
                  </div>
                </div>

                {/* Filtros de Entregas */}
                <div className="submissions-filter-bar">
                  <span className="filter-title"><i className="fas fa-filter"></i> Filtrar Alumnos:</span>
                  <div className="filter-buttons">
                    <button className={`filter-btn ${filtroEntrega === 'todos' ? 'active' : ''}`} onClick={() => setFiltroEntrega('todos')}>
                      Todos ({entregasActividad.length})
                    </button>
                    <button className={`filter-btn ${filtroEntrega === 'entregados' ? 'active' : ''}`} onClick={() => setFiltroEntrega('entregados')}>
                      Por Calificar ({entregasActividad.filter(e => e.entrega_id !== null && e.estado !== 'calificado').length})
                    </button>
                    <button className={`filter-btn ${filtroEntrega === 'calificados' ? 'active' : ''}`} onClick={() => setFiltroEntrega('calificados')}>
                      Calificados ({entregasActividad.filter(e => e.estado === 'calificado').length})
                    </button>
                    <button className={`filter-btn ${filtroEntrega === 'pendientes' ? 'active' : ''}`} onClick={() => setFiltroEntrega('pendientes')}>
                      Sin Entregar ({entregasActividad.filter(e => e.entrega_id === null).length})
                    </button>
                  </div>
                </div>

                {/* Listado de entregas */}
                <div className="submissions-list-wrapper">
                  {entregasFiltradas.length === 0 ? (
                    <div className="no-data-card">
                      <i className="fas fa-folder-open"></i>
                      <p>No se encontraron registros que coincidan con este filtro.</p>
                    </div>
                  ) : (
                    <div className="submissions-grid">
                      {entregasFiltradas.map(ent => {
                        const has_entrega = ent.entrega_id !== null;
                        const is_calificado = ent.estado === 'calificado';
                        const is_tarde = ent.estado === 'tarde';

                        return (
                          <div key={ent.estudiante_id} className={`submission-row-card ${is_calificado ? 'calificada' : has_entrega ? 'entregada' : 'no-entregada'}`}>
                            <div className="sub-card-left">
                              <div className="sub-student-avatar">
                                {ent.estudiante_nombre.charAt(0)}
                              </div>
                              <div className="sub-student-meta">
                                <h4>{ent.estudiante_nombre}</h4>
                                <p>Código: {ent.codigo_estudiante || 'S/C'} | {ent.email}</p>
                              </div>
                            </div>

                            <div className="sub-card-center">
                              {has_entrega ? (
                                <div className="sub-file-details">
                                  <span className="file-name-label">
                                    <i className="far fa-file-alt"></i> Archivo Adjunto
                                  </span>
                                  <a href={`http://localhost:8000/storage/seminarios/entregas/${ent.archivo}`} target="_blank" rel="noreferrer" className="btn-view-attachment">
                                    <i className="fas fa-external-link-alt"></i> Descargar Solución
                                  </a>
                                  {ent.comentario_estudiante && (
                                    <p className="student-comment-bubble">
                                      <strong>Comentario Alumno:</strong> "{ent.comentario_estudiante}"
                                    </p>
                                  )}
                                  <span className="submission-time-stamp">
                                    Entregado el: {new Date(ent.fecha_entrega).toLocaleString()}
                                  </span>
                                </div>
                              ) : (
                                <span className="no-submission-alert">
                                  <i className="fas fa-clock"></i> Pendiente de Carga
                                </span>
                              )}
                            </div>

                            <div className="sub-card-right">
                              {is_calificado ? (
                                <div className="sub-grade-details">
                                  <span className="grade-badge-value">Nota: {ent.nota}</span>
                                  {ent.comentario_tutor && (
                                    <p className="tutor-retro-preview">"{ent.comentario_tutor}"</p>
                                  )}
                                  <button onClick={() => abrirCalificar(ent)} className="btn-regrade">
                                    Corregir Nota
                                  </button>
                                </div>
                              ) : has_entrega ? (
                                <div className="sub-action-grade-pending">
                                  <span className="status-badge por-calificar">Por Calificar</span>
                                  <button onClick={() => abrirCalificar(ent)} className="btn-submit-grade">
                                    <i className="fas fa-star"></i> Calificar
                                  </button>
                                </div>
                              ) : (
                                <span className="status-badge no-entregado-badge">Sin entrega</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* PESTAÑA 3: RECURSOS / SOPORTE */}
        {activeTab === 'recursos' && (
          <section className="tab-pane-content animate-fade-in">
            <div className="tab-pane-header">
              <div className="pane-title-details">
                <h2>Material de Apoyo Académico</h2>
                <p>Comparta libros, guías de laboratorios, diapositivas o enlaces con los estudiantes del seminario</p>
              </div>
              <button onClick={() => setModalRecurso(true)} className="btn-add-resource">
                <i className="fas fa-cloud-upload-alt"></i> + Compartir Material
              </button>
            </div>

            {recursos.length === 0 ? (
              <div className="no-data-card margin-top-30">
                <i className="fas fa-folder-open"></i>
                <h3>No hay materiales cargados</h3>
                <p>Cargue archivos o comparta links de Google Drive con sus estudiantes.</p>
                <button onClick={() => setModalRecurso(true)} className="btn-add-resource margin-top-15">
                  Subir Primer Material
                </button>
              </div>
            ) : (
              <div className="resources-premium-grid margin-top-30">
                {recursos.map(rec => {
                  const is_file = rec.tipo === 'archivo';

                  return (
                    <div key={rec.id} className="resource-card-premium">
                      <div className="resource-card-icon-header">
                        <div className={`resource-icon-circle ${is_file ? 'pdf-type' : 'link-type'}`}>
                          <i className={is_file ? 'fas fa-file-pdf' : 'fas fa-link'}></i>
                        </div>
                        <button onClick={() => handleEliminarRecurso(rec.id)} className="btn-delete-resource" title="Eliminar material">
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                      <div className="resource-card-body">
                        <h3>{rec.titulo}</h3>
                        <p>{rec.descripcion || 'Sin descripción adicional.'}</p>
                      </div>
                      <div className="resource-card-footer">
                        {is_file ? (
                          <a href={`http://localhost:8000/storage/seminarios/recursos/${rec.archivo}`} target="_blank" rel="noreferrer" className="btn-access-resource">
                            Descargar Archivo <i className="fas fa-download"></i>
                          </a>
                        ) : (
                          <a href={rec.url} target="_blank" rel="noreferrer" className="btn-access-resource btn-access-link">
                            Abrir Enlace <i className="fas fa-external-link-alt"></i>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

      </main>

      {/* MODAL 1: ACTUALIZAR ENLACE DE CLASE */}
      {modalEnlace && (
        <div className="ts-modal-overlay">
          <div className="ts-modal-box">
            <div className="ts-modal-header">
              <h2><i className="fas fa-link"></i> Configurar Clase Virtual</h2>
              <button onClick={() => setModalEnlace(false)} className="ts-close-modal">&times;</button>
            </div>
            <form onSubmit={handleUpdateEnlace}>
              <div className="ts-modal-body">
                <p className="modal-instruction-text">
                  Escriba el enlace estático que utilizarán los estudiantes para unirse a las asesorías virtuales (ej: Zoom, Google Meet o Microsoft Teams).
                </p>
                <div className="form-group-field">
                  <label>Enlace de la Reunión *</label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={nuevoEnlace}
                    onChange={e => setNuevoEnlace(e.target.value)}
                    required
                    className="modal-text-input"
                  />
                </div>
              </div>
              <div className="ts-modal-footer">
                <button type="button" onClick={() => setModalEnlace(false)} className="btn-modal-cancel">Cancelar</button>
                <button type="submit" className="btn-modal-save">Guardar Enlace</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREAR / EDITAR ACTIVIDAD */}
      {modalActividad && (
        <div className="ts-modal-overlay">
          <div className="ts-modal-box width-large">
            <div className="ts-modal-header">
              <h2><i className="fas fa-edit"></i> {actividadEditar ? 'Modificar Actividad' : 'Nueva Actividad Académica'}</h2>
              <button onClick={() => setModalActividad(false)} className="ts-close-modal">&times;</button>
            </div>
            <form onSubmit={handleGuardarActividad}>
              <div className="ts-modal-body">

                <div className="form-group-field">
                  <label>Título de la Actividad *</label>
                  <input
                    type="text"
                    placeholder="Ej: Entrega Primer Avance - Marco Teórico"
                    value={formActividad.titulo}
                    onChange={e => setFormActividad({ ...formActividad, titulo: e.target.value })}
                    required
                    className="modal-text-input"
                  />
                </div>

                <div className="form-group-field">
                  <label>Descripción / Instrucciones</label>
                  <textarea
                    rows="4"
                    placeholder="Escriba las pautas detalladas para esta entrega..."
                    value={formActividad.descripcion}
                    onChange={e => setFormActividad({ ...formActividad, descripcion: e.target.value })}
                    className="modal-text-input"
                  ></textarea>
                </div>

                <div className="modal-form-row">
                  <div className="form-group-field flex-1">
                    <label>Nota Máxima *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      placeholder="5.0"
                      value={formActividad.puntaje}
                      onChange={e => setFormActividad({ ...formActividad, puntaje: parseFloat(e.target.value) || 5.0 })}
                      required
                      className="modal-text-input"
                    />
                    <span className="input-hint-label">Calificación máxima tradicional</span>
                  </div>

                  <div className="form-group-field flex-1">
                    <label>Fecha Límite *</label>
                    <input
                      type="date"
                      value={formActividad.fecha_limite}
                      onChange={e => setFormActividad({ ...formActividad, fecha_limite: e.target.value })}
                      required
                      className="modal-text-input"
                    />
                  </div>

                  <div className="form-group-field flex-1">
                    <label>Hora Límite *</label>
                    <input
                      type="time"
                      value={formActividad.hora_limite}
                      onChange={e => setFormActividad({ ...formActividad, hora_limite: e.target.value })}
                      required
                      className="modal-text-input"
                    />
                  </div>
                </div>

                <div className="form-group-checkbox-field">
                  <input
                    type="checkbox"
                    id="tardias"
                    checked={formActividad.permite_entregas_tardias}
                    onChange={e => setFormActividad({ ...formActividad, permite_entregas_tardias: e.target.checked })}
                  />
                  <label htmlFor="tardias">
                    <strong>Permitir Entregas Tardías:</strong> Si se activa, los alumnos podrán cargar su tarea después de la fecha límite (quedará registrada con retraso).
                  </label>
                </div>

              </div>
              <div className="ts-modal-footer">
                <button type="button" onClick={() => setModalActividad(false)} className="btn-modal-cancel">Cancelar</button>
                <button type="submit" className="btn-modal-save">{actividadEditar ? 'Actualizar Actividad' : 'Asignar Actividad'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CALIFICAR ENTREGA */}
      {modalCalificar && (
        <div className="ts-modal-overlay">
          <div className="ts-modal-box">
            <div className="ts-modal-header">
              <h2><i className="fas fa-check-double"></i> Calificar Estudiante</h2>
              <button onClick={() => setModalCalificar(false)} className="ts-close-modal">&times;</button>
            </div>
            <form onSubmit={handleCalificarEntrega}>
              <div className="ts-modal-body">
                <div className="calificar-student-card-details">
                  <div className="avatar-letter">{entregaSeleccionada.estudiante_nombre.charAt(0)}</div>
                  <div>
                    <h4>{entregaSeleccionada.estudiante_nombre}</h4>
                    <p>Entrega de: <strong>{actividadSeleccionada.titulo}</strong></p>
                  </div>
                </div>

                <div className="form-group-field margin-top-20">
                  <label>Nota del Trabajo (Escala 0.0 - 5.0) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5.0"
                    placeholder="Ej: 4.5"
                    value={formCalificacion.nota}
                    onChange={e => setFormCalificacion({ ...formCalificacion, nota: e.target.value })}
                    required
                    className="modal-text-input text-align-center font-size-large"
                  />
                </div>

                <div className="form-group-field">
                  <label>Retroalimentación / Comentarios para el Alumno</label>
                  <textarea
                    rows="4"
                    placeholder="Escriba las observaciones del trabajo, mejoras requeridas, etc..."
                    value={formCalificacion.comentario_tutor}
                    onChange={e => setFormCalificacion({ ...formCalificacion, comentario_tutor: e.target.value })}
                    className="modal-text-input"
                  ></textarea>
                </div>
              </div>
              <div className="ts-modal-footer">
                <button type="button" onClick={() => setModalCalificar(false)} className="btn-modal-cancel">Cancelar</button>
                <button type="submit" className="btn-modal-save">Enviar Calificación</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SUBIR RECURSO */}
      {modalRecurso && (
        <div className="ts-modal-overlay">
          <div className="ts-modal-box">
            <div className="ts-modal-header">
              <h2><i className="fas fa-cloud-upload-alt"></i> Compartir Material de Apoyo</h2>
              <button onClick={() => setModalRecurso(false)} className="ts-close-modal">&times;</button>
            </div>
            <form onSubmit={handleGuardarRecurso}>
              <div className="ts-modal-body">

                <div className="form-group-field">
                  <label>Título del Material *</label>
                  <input
                    type="text"
                    placeholder="Ej: Guía Básica Normas APA Séptima Edición"
                    value={formRecurso.titulo}
                    onChange={e => setFormRecurso({ ...formRecurso, titulo: e.target.value })}
                    required
                    className="modal-text-input"
                  />
                </div>

                <div className="form-group-field">
                  <label>Descripción Breve</label>
                  <textarea
                    rows="2"
                    placeholder="Opcional: Diapositivas explicativas sobre la clase..."
                    value={formRecurso.descripcion}
                    onChange={e => setFormRecurso({ ...formRecurso, descripcion: e.target.value })}
                    className="modal-text-input"
                  ></textarea>
                </div>

                <div className="form-group-field">
                  <label>Tipo de Recurso *</label>
                  <select
                    value={formRecurso.tipo}
                    onChange={e => setFormRecurso({ ...formRecurso, tipo: e.target.value, archivo: null, url: '' })}
                    className="modal-text-input"
                  >
                    <option value="archivo">Archivo Físico (PDF, Word, Excel, PPTX)</option>
                    <option value="enlace">Enlace Web Externo (Google Drive, YouTube, etc.)</option>
                  </select>
                </div>

                {formRecurso.tipo === 'archivo' ? (
                  <div className="form-group-field">
                    <label>Seleccionar Archivo (Máx: 15MB) *</label>
                    <input
                      type="file"
                      onChange={e => setFormRecurso({ ...formRecurso, archivo: e.target.files[0] })}
                      required
                      className="modal-text-input"
                    />
                    <span className="input-hint-label">Formatos recomendados: PDF, DOCX, XLSX.</span>
                  </div>
                ) : (
                  <div className="form-group-field">
                    <label>Enlace URL Externo *</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={formRecurso.url}
                      onChange={e => setFormRecurso({ ...formRecurso, url: e.target.value })}
                      required
                      className="modal-text-input"
                    />
                  </div>
                )}

              </div>
              <div className="ts-modal-footer">
                <button type="button" onClick={() => setModalRecurso(false)} className="btn-modal-cancel">Cancelar</button>
                <button type="submit" className="btn-modal-save">Publicar Material</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
