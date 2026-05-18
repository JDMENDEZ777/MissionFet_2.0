import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './EstudianteSeminario.css';

export default function EstudianteSeminario() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState({ text: '', type: '' });

  // Datos principales
  const [seminario, setSeminario] = useState(null);
  const [tutor, setTutor] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [stats, setStats] = useState({ actividades_entregadas: 0, actividades_totales: 0, nota_acumulada: null });

  // Control de vistas (pestañas)
  const [activeTab, setActiveTab] = useState('inicio'); // 'inicio', 'actividades', 'recursos'

  // Control de modal de entrega
  const [modalEntrega, setModalEntrega] = useState(false);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [archivoEntrega, setArchivoEntrega] = useState(null);
  const [comentarioEstudiante, setComentarioEstudiante] = useState('');
  const [submittingEntrega, setSubmittingEntrega] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.rol !== 'estudiante') {
      navigate('/login');
      return;
    }
    fetchSeminarioData();
  }, []);

  const fetchSeminarioData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Obtener seminario e información general
      const resInfo = await api.get('/estudiante/seminario');
      
      if (resInfo.data.success && resInfo.data.seminario) {
        setSeminario(resInfo.data.seminario);
        setTutor(resInfo.data.tutor);
        setStats(resInfo.data.stats);

        // 2. Obtener actividades y recursos en paralelo
        const [resAct, resRec] = await Promise.all([
          api.get('/estudiante/seminario/actividades'),
          api.get('/estudiante/seminario/recursos')
        ]);

        if (resAct.data.success) {
          setActividades(resAct.data.actividades);
        }
        if (resRec.data.success) {
          setRecursos(resRec.data.recursos);
        }
      } else {
        setSeminario(null);
      }
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al cargar la información del aula virtual.');
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensaje = (text, type) => {
    setMensaje({ text, type });
    window.scrollTo(0, 0);
    setTimeout(() => setMensaje({ text: '', type: '' }), 5000);
  };

  // Abrir modal de entrega de tarea
  const abrirModalEntrega = (actividad) => {
    setActividadSeleccionada(actividad);
    setArchivoEntrega(null);
    setComentarioEstudiante('');
    setModalEntrega(true);
  };

  // Enviar entrega al tutor
  const handleEnviarEntrega = async (e) => {
    e.preventDefault();
    if (!archivoEntrega) {
      alert('Por favor selecciona un archivo físico para subir.');
      return;
    }

    setSubmittingEntrega(true);
    const formData = new FormData();
    formData.append('actividad_id', actividadSeleccionada.actividad_id);
    formData.append('archivo', archivoEntrega);
    if (comentarioEstudiante) {
      formData.append('comentario_estudiante', comentarioEstudiante);
    }

    try {
      const response = await api.post('/estudiante/seminario/entregas', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      mostrarMensaje(response.data.message || 'Actividad entregada exitosamente.', 'success');
      setModalEntrega(false);
      // Recargar datos para actualizar estado y promedio
      await fetchSeminarioData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al enviar la entrega.');
    } finally {
      setSubmittingEntrega(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="estudiante-seminario-loading">
        <div className="spinner"></div>
        <p>Cargando Aula Virtual del Seminario...</p>
      </div>
    );
  }

  // Si no está matriculado
  if (!seminario) {
    return (
      <div className="estudiante-seminario-container">
        <div className="es-header">
          <div className="es-header-left">
            <img src="/IMG/logofet.png" alt="FET Logo" className="es-logo" />
            <div className="es-title-wrapper">
              <span className="badge-modalidad">Seminario de Grado</span>
              <h1>Sin Seminario Asignado</h1>
            </div>
          </div>
        </div>

        <div className="no-seminario-box">
          <i className="fas fa-chalkboard-teacher"></i>
          <h2>No estás matriculado en ningún seminario</h2>
          <p>
            Actualmente no posees una matrícula activa en Seminarios de Grado. 
            Comunícate con el Administrador o la Coordinación Académica de la FET para que te asigne a un seminario y tema correspondiente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="estudiante-seminario-container">
      
      {/* HEADER DE ESTUDIANTE */}
      <header className="es-header">
        <div className="es-header-left">
          <img src="/IMG/logofet.png" alt="FET Logo" className="es-logo" />
          <div className="es-title-wrapper">
            <span className="badge-modalidad">Seminario de Grado</span>
            <h1>{seminario.titulo}</h1>
          </div>
        </div>
        <div className="es-header-right">
          <button className="btn-logout-es" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Salir
          </button>
        </div>
      </header>

      {/* FEEDBACK BANNERS */}
      {mensaje.text && (
        <div className={`es-alert es-alert-${mensaje.type} animate-fade-in`}>
          <i className={mensaje.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}></i>
          <span>{mensaje.text}</span>
        </div>
      )}

      {/* TARJETA DE REUNIÓN VIRTUAL MEET (SI ES VIRTUAL) */}
      {seminario.modalidad === 'virtual' && (
        <div className="meet-widget-card-es">
          <div className="meet-widget-left-es">
            <div className="meet-icon-wrapper-es">
              <i className="fas fa-video"></i>
            </div>
            <div className="meet-details-es">
              <h3>Enlace a Clases en Vivo</h3>
              <p className="meet-hint-es">Haz clic en el botón de la derecha para conectarte a las videollamadas con tu docente tutor.</p>
              {seminario.lugar ? (
                <a href={seminario.lugar} target="_blank" rel="noreferrer" className="meet-link-url-es">
                  <i className="fas fa-external-link-alt"></i> {seminario.lugar}
                </a>
              ) : (
                <span className="meet-no-link-es">El link de clase aún no ha sido configurado por el tutor.</span>
              )}
            </div>
          </div>
          {seminario.lugar && (
            <a href={seminario.lugar} target="_blank" rel="noreferrer" className="btn-go-meet-es">
              <i className="fas fa-door-open"></i> Entrar a Clase
            </a>
          )}
        </div>
      )}

      {/* PESTAÑAS DE NAVEGACIÓN */}
      <nav className="es-tabs-navigation">
        <button 
          className={`tab-btn-es ${activeTab === 'inicio' ? 'active' : ''}`}
          onClick={() => setActiveTab('inicio')}
        >
          <i className="fas fa-home"></i> General y Progreso
        </button>
        <button 
          className={`tab-btn-es ${activeTab === 'actividades' ? 'active' : ''}`}
          onClick={() => setActiveTab('actividades')}
        >
          <i className="fas fa-tasks"></i> Actividades del Curso ({actividades.length})
        </button>
        <button 
          className={`tab-btn-es ${activeTab === 'recursos' ? 'active' : ''}`}
          onClick={() => setActiveTab('recursos')}
        >
          <i className="fas fa-folder-open"></i> Material de Apoyo ({recursos.length})
        </button>
      </nav>

      {/* CONTENIDO DE PESTAÑAS */}
      <div className="es-tab-content-wrapper">

        {/* PESTAÑA 1: INICIO Y PROGRESO */}
        {activeTab === 'inicio' && (
          <div className="es-grid-two-cols animate-fade-in">
            
            {/* Información del Seminario */}
            <div className="es-info-card">
              <h2>Detalles Generales del Seminario</h2>
              <p className="desc-text-es">{seminario.descripcion}</p>

              <div className="info-meta-grid-es">
                <div className="meta-box-es">
                  <span className="meta-label-es">Docente Tutor Encargado</span>
                  <span className="meta-value-es">
                    <i className="fas fa-user-tie"></i> {tutor ? tutor.nombre : 'No asignado'}
                  </span>
                  {tutor && <span className="meta-sub-es">{tutor.email}</span>}
                </div>

                <div className="meta-box-es">
                  <span className="meta-label-es">Modalidad de Dictado</span>
                  <span className="meta-value-es text-capitalize">
                    <i className="fas fa-map-marker-alt"></i> {seminario.modalidad}
                  </span>
                </div>

                <div className="meta-box-es">
                  <span className="meta-label-es">Fecha de Clases</span>
                  <span className="meta-value-es">
                    <i className="fas fa-calendar-alt"></i> {seminario.fecha}
                  </span>
                </div>

                <div className="meta-box-es">
                  <span className="meta-label-es">Horario Semanal</span>
                  <span className="meta-value-es">
                    <i className="fas fa-clock"></i> {seminario.hora}
                  </span>
                </div>
              </div>

              {/* Descargar Guía de Seminario si existe */}
              {seminario.archivo_guia && (
                <div className="guia-download-card-es">
                  <div className="guia-icon-es">
                    <i className="fas fa-file-pdf"></i>
                  </div>
                  <div className="guia-info-es">
                    <h4>Guía General del Seminario de Grado</h4>
                    <p>Contiene el cronograma, reglas académicas y los entregables esperados.</p>
                  </div>
                  <a 
                    href={`http://localhost:8000/storage/seminarios/${seminario.archivo_guia}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn-download-guia-es"
                  >
                    <i className="fas fa-cloud-download-alt"></i> Descargar Guía
                  </a>
                </div>
              )}
            </div>

            {/* Sidebar de Progreso y Promedio */}
            <div className="es-stats-sidebar">
              
              {/* Tarjeta de Nota Promedio */}
              <div className="es-stat-grade-card">
                <h3>Nota Promedio Acumulada</h3>
                <div className="grade-circle-wrapper">
                  <div className={`grade-circle ${stats.nota_acumulada >= 3.0 ? 'pass' : (stats.nota_acumulada !== null ? 'fail' : 'pending')}`}>
                    <span className="grade-value-big">
                      {stats.nota_acumulada !== null ? stats.nota_acumulada.toFixed(1) : '---'}
                    </span>
                    <span className="grade-scale">Escala: 0.0 - 5.0</span>
                  </div>
                </div>
                <p className="grade-hint-text">
                  {stats.nota_acumulada !== null 
                    ? (stats.nota_acumulada >= 3.0 
                      ? '🎉 ¡Vas aprobando con éxito!' 
                      : '⚠️ Tu promedio está por debajo de 3.0. Revisa tus entregas.')
                    : 'Aún no posees actividades calificadas por tu tutor.'
                  }
                </p>
              </div>

              {/* Tarjeta de Tareas Entregadas */}
              <div className="stats-mini-card-es">
                <div className="stat-icon-circle-es green-bg-es">
                  <i className="fas fa-clipboard-check"></i>
                </div>
                <div className="stat-info-text-es">
                  <h3>{stats.actividades_entregadas} / {stats.actividades_totales}</h3>
                  <p>Actividades Entregadas</p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* PESTAÑA 2: LISTAR ACTIVIDADES */}
        {activeTab === 'actividades' && (
          <div className="animate-fade-in">
            <div className="tab-pane-header-es">
              <div className="pane-title-details-es">
                <h2>Actividades Evaluativas del Seminario</h2>
                <p>Mantente al día con los plazos establecidos. No olvides subir tus archivos en formato PDF, Word o comprimidos.</p>
              </div>
            </div>

            {actividades.length === 0 ? (
              <div className="no-data-card-es">
                <i className="fas fa-tasks"></i>
                <h3>Sin Actividades Asignadas</h3>
                <p>Tu tutor aún no ha publicado ninguna actividad evaluable para este seminario.</p>
              </div>
            ) : (
              <div className="activities-grid-es">
                {actividades.map(act => {
                  const fechaLimite = new Date(`${act.fecha_limite} ${act.hora_limite}`);
                  const ahora = new Date();
                  const estaExpirado = ahora > fechaLimite;
                  
                  return (
                    <div key={act.actividad_id} className="activity-premium-card-es">
                      
                      <div className="activity-card-header-es">
                        <h3>{act.titulo}</h3>
                        <span className="badge-max-grade-es">Nota Máx: {parseFloat(act.nota_maxima).toFixed(1)}</span>
                      </div>

                      <div className="activity-card-body-es">
                        <p className="activity-description-es">{act.descripcion}</p>

                        <div className="activity-deadlines-es">
                          <p><i className="fas fa-calendar-day"></i> <strong>Límite:</strong> {act.fecha_limite}</p>
                          <p><i className="fas fa-clock"></i> <strong>Hora:</strong> {act.hora_limite}</p>
                          <p>
                            <i className="fas fa-exclamation-triangle"></i> 
                            <strong>Entregas Tardías:</strong> {act.permite_entregas_tardias ? 'Sí' : 'No'}
                          </p>
                        </div>

                        {/* ESTADO DE LA ENTREGA */}
                        <div className="activity-delivery-status-box">
                          {act.entrega_id ? (
                            <div className="delivery-status-details">
                              <span className={`status-badge-es ${act.estado}`}>
                                {act.estado === 'calificado' && 'Calificado'}
                                {act.estado === 'entregado' && 'Entregado a Tiempo'}
                                {act.estado === 'tarde' && 'Entregado Tarde'}
                              </span>

                              {/* Mostrar Nota si está Calificada */}
                              {act.estado === 'calificado' && (
                                <div className="grade-report-box">
                                  <span className="grade-obtained">Nota: {parseFloat(act.nota).toFixed(1)}</span>
                                  {act.comentario_tutor && (
                                    <p className="tutor-feedback">
                                      <strong>Retroalimentación:</strong> "{act.comentario_tutor}"
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Mostrar detalles del archivo subido */}
                              <div className="uploaded-file-details">
                                <span><i className="fas fa-file-alt"></i> Mi entrega:</span>
                                <a 
                                  href={`http://localhost:8000/storage/seminarios/entregas/${act.archivo}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="uploaded-file-link"
                                >
                                  Ver Archivo Cargado
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="delivery-status-details">
                              <span className="status-badge-es sin-entregar">Sin Entregar</span>
                              
                              {estaExpirado && !act.permite_entregas_tardias ? (
                                <div className="error-delivery-text">
                                  <i className="fas fa-lock"></i> Expiró el plazo y no admite entregas tardías.
                                </div>
                              ) : (
                                <button 
                                  className="btn-subir-entrega-es"
                                  onClick={() => abrirModalEntrega(act)}
                                >
                                  <i className="fas fa-cloud-upload-alt"></i> Subir Mi Entrega
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 3: MATERIAL DE APOYO */}
        {activeTab === 'recursos' && (
          <div className="animate-fade-in">
            <div className="tab-pane-header-es">
              <div className="pane-title-details-es">
                <h2>Biblioteca y Material de Apoyo</h2>
                <p>Consulta las lecturas, links y guías complementarias provistas por tu tutor académico.</p>
              </div>
            </div>

            {recursos.length === 0 ? (
              <div className="no-data-card-es">
                <i className="fas fa-folder-open"></i>
                <h3>Sin Materiales Compartidos</h3>
                <p>Tu tutor aún no ha subido ningún documento o enlace de apoyo para las clases.</p>
              </div>
            ) : (
              <div className="resources-premium-grid-es">
                {recursos.map(rec => (
                  <div key={rec.id} className="resource-card-premium-es">
                    
                    <div className="resource-card-icon-header-es">
                      <div className={`resource-icon-circle-es ${rec.tipo === 'archivo' ? 'pdf-type-es' : 'link-type-es'}`}>
                        <i className={rec.tipo === 'archivo' ? 'fas fa-file-pdf' : 'fas fa-link'}></i>
                      </div>
                    </div>

                    <div className="resource-card-body-es">
                      <h3>{rec.titulo}</h3>
                      <p>{rec.descripcion || 'Sin descripción adicional.'}</p>
                    </div>

                    {rec.tipo === 'archivo' ? (
                      <a 
                        href={`http://localhost:8000/storage/seminarios/recursos/${rec.archivo}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn-access-resource-es"
                      >
                        <i className="fas fa-cloud-download-alt"></i> Abrir Documento
                      </a>
                    ) : (
                      <a 
                        href={rec.link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn-access-resource-es btn-access-link-es"
                      >
                        <i className="fas fa-external-link-alt"></i> Visitar Enlace
                      </a>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL DE ENTREGA DE ACTIVIDAD */}
      {modalEntrega && actividadSeleccionada && (
        <div className="es-modal-overlay">
          <div className="es-modal-box">
            
            <div className="es-modal-header">
              <h2><i className="fas fa-cloud-upload-alt"></i> Subir Entrega</h2>
              <button className="es-close-modal" onClick={() => setModalEntrega(false)}>&times;</button>
            </div>

            <form onSubmit={handleEnviarEntrega}>
              <div className="es-modal-body">
                <div className="calificar-student-card-details-es">
                  <div>
                    <h4>Actividad: {actividadSeleccionada.titulo}</h4>
                    <p>Nota Máxima: {parseFloat(actividadSeleccionada.nota_maxima).toFixed(1)} puntos</p>
                  </div>
                </div>

                <div className="form-group-field-es">
                  <label>Selecciona tu Archivo de Entrega *</label>
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx,.zip,.rar" 
                    onChange={e => setArchivoEntrega(e.target.files[0])} 
                    required 
                    className="modal-text-input-es"
                  />
                  <span className="input-hint-label-es">Formatos permitidos: PDF, Word (doc/docx), Comprimidos (zip/rar). Máx: 15MB</span>
                </div>

                <div className="form-group-field-es">
                  <label>Comentario o Nota para el Tutor (Opcional)</label>
                  <textarea 
                    rows="3" 
                    placeholder="Escribe alguna aclaración sobre tu entrega..." 
                    value={comentarioEstudiante}
                    onChange={e => setComentarioEstudiante(e.target.value)}
                    className="modal-text-input-es"
                  />
                </div>
              </div>

              <div className="es-modal-footer">
                <button 
                  type="button" 
                  className="btn-modal-cancel-es" 
                  onClick={() => setModalEntrega(false)}
                  disabled={submittingEntrega}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-modal-save-es"
                  disabled={submittingEntrega}
                >
                  {submittingEntrega ? 'Enviando...' : 'Enviar Tarea'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
