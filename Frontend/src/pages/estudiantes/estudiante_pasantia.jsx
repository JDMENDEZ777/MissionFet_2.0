import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './estudiante_pasantia.css';

const API = 'http://localhost:8000/api';

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const getHeadersMultipart = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'multipart/form-data'
  }
});

const estadoBadge = (estado) => {
  const map = {
    pendiente: ['eps-badge eps-badge-pending', 'Pendiente'],
    en_curso: ['eps-badge eps-badge-process', 'En Curso'],
    finalizada: ['eps-badge eps-badge-approved', 'Finalizada'],
    rechazada: ['eps-badge eps-badge-rejected', 'Rechazada'],
  };
  const [cls, label] = map[estado] || ['eps-badge eps-badge-pending', estado];
  return <span className={cls}>{label}</span>;
};

export default function EstudiantePasantia() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [section, setSection] = useState('dashboard'); // 'dashboard', 'acta', 'plan', 'bitacoras', 'evaluaciones'
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [pasantia, setPasantia] = useState(null);
  const [asistencias, setAsistencias] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);

  // Firma del estudiante
  const [firmaEstudianteUrl, setFirmaEstudianteUrl] = useState('');
  const [firmaFile, setFirmaFile] = useState(null);
  const [uploadingFirma, setUploadingFirma] = useState(false);

  // FORMULARIO: ACTA DE INICIO (PE-PCA-F-005)
  const [actaForm, setActaForm] = useState({
    fecha: '',
    hora: '',
    asistentes: '',
    ordenDiaInput: '',
    ordenDiaList: ['Presentación del Asesor y Estudiante Practicante', 'Verificación de la asignación horaria de 384 hs', 'Establecimiento del Plan de Trabajo'],
    desarrolloInput: '',
    desarrolloList: ['Se inicia la sesión virtual/presencial procediendo con las firmas correspondientes.', 'Se acuerdan tutorías quincenales para la revisión de informes y planilla de control de asistencia.']
  });

  // FORMULARIO: PLAN DE TRABAJO (PM-PSO-F-002)
  const [planForm, setPlanForm] = useState({
    nombreConvenio: '',
    duracion: '384 Horas',
    competencia: '',
    actividad: '',
    fecha: '',
    actividadesList: []
  });

  // FORMULARIO: REGISTRO DE BITÁCORA
  const [bitacoraForm, setBitacoraForm] = useState({
    semana: '',
    fecha_inicio: '',
    fecha_fin: '',
    actividad: '',
    horas: '',
    evidencia: null
  });
  const [submittingBitacora, setSubmittingBitacora] = useState(false);

  // Auth guard
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user'));
    if (!u || u.rol !== 'estudiante') {
      navigate('/login');
      return;
    }
    setUser(u);
    if (u.firma) {
      setFirmaEstudianteUrl(u.firma);
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API}/estudiante/pasantia`, getHeaders());
      if (response.data.success) {
        setPasantia(response.data.pasantia);
        setAsistencias(response.data.asistencias || []);
        setEvaluaciones(response.data.evaluaciones || []);
        
        // Precargar firma si existe en pasantía o usuario
        if (response.data.pasantia.firma_estudiante) {
          setFirmaEstudianteUrl(response.data.pasantia.firma_estudiante);
        }

        // Cargar datos guardados si existen
        if (response.data.pasantia.acta_inicio) {
          const act = response.data.pasantia.acta_inicio;
          setActaForm({
            fecha: act.fecha || '',
            hora: act.hora || '',
            asistentes: act.asistentes || '',
            ordenDiaInput: '',
            ordenDiaList: act.orden_dia || [],
            desarrolloInput: '',
            desarrolloList: act.desarrollo || []
          });
        }

        if (response.data.pasantia.plan_trabajo) {
          const pt = response.data.pasantia.plan_trabajo;
          setPlanForm({
            nombreConvenio: pt.nombre_convenio || '',
            duracion: pt.duracion || '384 Horas',
            competencia: '',
            actividad: '',
            fecha: '',
            actividadesList: pt.actividades || []
          });
        }
      } else {
        setError(response.data.message);
      }
    } catch (e) {
      setError('Error al consultar tu pasantía activa. Valida que tengas una registrada.');
    } finally {
      setLoading(false);
    }
  };

  // Subir Firma Digital del Estudiante
  const handleSubirFirma = async (e) => {
    e.preventDefault();
    if (!firmaFile) return;

    setUploadingFirma(true);
    setError('');
    setSuccess('');

    const fd = new FormData();
    fd.append('firma', firmaFile);

    try {
      const response = await axios.post(`${API}/estudiante/pasantia/subir-firma`, fd, getHeadersMultipart());
      if (response.data.success) {
        setSuccess('¡Firma digital almacenada!');
        setFirmaEstudianteUrl(response.data.firma);
        // Actualizar localstorage
        const u = JSON.parse(localStorage.getItem('user'));
        u.firma = response.data.firma;
        localStorage.setItem('user', JSON.stringify(u));
        setUser(u);
      } else {
        setError(response.data.message);
      }
    } catch (e) {
      setError('Error al subir la firma.');
    } finally {
      setUploadingFirma(false);
    }
  };

  // Guardar Acta de Inicio
  const handleGuardarActa = async (e) => {
    e.preventDefault();
    if (!actaForm.fecha || !actaForm.hora || !actaForm.asistentes) {
      setError('Por favor completa todos los campos del acta.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        acta_inicio: {
          fecha: actaForm.fecha,
          hora: actaForm.hora,
          asistentes: actaForm.asistentes,
          orden_dia: actaForm.ordenDiaList,
          desarrollo: actaForm.desarrolloList
        }
      };

      const res = await axios.post(`${API}/estudiante/pasantia/guardar-acta`, payload, getHeaders());
      if (res.data.success) {
        setSuccess('¡Acta de Inicio guardada correctamente!');
        loadData();
      } else {
        setError(res.data.message);
      }
    } catch (e) {
      setError('Error al registrar el Acta.');
    } finally {
      setLoading(false);
    }
  };

  // Guardar Plan de Trabajo
  const handleGuardarPlan = async (e) => {
    e.preventDefault();

    let currentActivities = [...planForm.actividadesList];
    if (planForm.competencia && planForm.actividad && planForm.fecha) {
      currentActivities.push({
        competencia: planForm.competencia,
        actividad: planForm.actividad,
        fecha: planForm.fecha
      });
      // Limpiar los campos locales de forma reactiva
      setPlanForm(prev => ({
        ...prev,
        competencia: '',
        actividad: '',
        fecha: '',
        actividadesList: currentActivities
      }));
    }

    if (!planForm.nombreConvenio || currentActivities.length === 0) {
      setError('Por favor indica el nombre del convenio y agrega al menos una actividad.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        plan_trabajo: {
          nombre_convenio: planForm.nombreConvenio,
          duracion: planForm.duracion,
          actividades: currentActivities
        }
      };

      const res = await axios.post(`${API}/estudiante/pasantia/guardar-plan`, payload, getHeaders());
      if (res.data.success) {
        setSuccess('¡Plan de Trabajo de Prácticas registrado con éxito!');
        loadData();
      } else {
        setError(res.data.message);
      }
    } catch (e) {
      setError('Error al guardar el plan.');
    } finally {
      setLoading(false);
    }
  };

  // Guardar Bitácora Semanal
  const handleGuardarBitacora = async (e) => {
    e.preventDefault();
    if (!bitacoraForm.semana || !bitacoraForm.fecha_inicio || !bitacoraForm.fecha_fin || !bitacoraForm.actividad || !bitacoraForm.horas) {
      setError('Completa la información del reporte semanal antes de enviar.');
      return;
    }

    setSubmittingBitacora(true);
    setError('');
    setSuccess('');

    const fd = new FormData();
    fd.append('semana', bitacoraForm.semana);
    fd.append('fecha_inicio', bitacoraForm.fecha_inicio);
    fd.append('fecha_fin', bitacoraForm.fecha_fin);
    fd.append('actividad', bitacoraForm.actividad);
    fd.append('horas', bitacoraForm.horas);
    if (bitacoraForm.evidencia) {
      fd.append('evidencia', bitacoraForm.evidencia);
    }

    try {
      const res = await axios.post(`${API}/estudiante/pasantia/asistencias`, fd, getHeadersMultipart());
      if (res.data.success) {
        setSuccess('¡Reporte semanal enviado exitosamente para la aprobación del tutor!');
        // Reset form
        setBitacoraForm({
          semana: '', fecha_inicio: '', fecha_fin: '', actividad: '', horas: '', evidencia: null
        });
        loadData();
      } else {
        setError(res.data.message);
      }
    } catch (e) {
      setError('No se pudo enviar la asistencia.');
    } finally {
      setSubmittingBitacora(false);
    }
  };

  const handleEliminarAsistencia = async (id) => {
    if (!window.confirm('¿Deseas eliminar este registro de asistencia?')) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await axios.delete(`${API}/estudiante/pasantia/asistencias/${id}`, getHeaders());
      if (res.data.success) {
        setSuccess('Reporte eliminado.');
        loadData();
      } else {
        setError(res.data.message);
      }
    } catch (e) {
      setError('Error al eliminar.');
    } finally {
      setLoading(false);
    }
  };

  // Live total sum approved hours
  const totalHorasAprobadas = asistencias
    .filter(x => x.estado === 'aprobado')
    .reduce((acc, curr) => acc + parseFloat(curr.horas), 0);

  if (loading && !pasantia) {
    return (
      <div className="eps-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '3rem', color: 'var(--eps-primary)' }}></i>
          <p style={{ marginTop: '1rem', color: 'var(--eps-text-muted)', fontWeight: 600 }}>Cargando expediente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="eps-wrapper">
      
      {/* SIDEBAR */}
      <aside className="eps-sidebar">
        <div className="eps-sidebar-header">
          <img src="/IMG/logofet.png" alt="FET Logo" className="eps-sidebar-logo" />
          <h2 style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '0.05em', margin: 0 }}>MI PASANTÍA</h2>
        </div>
        <nav className="eps-sidebar-menu">
          <button className={`eps-menu-item ${section === 'dashboard' ? 'active' : ''}`} onClick={() => { setSection('dashboard'); setError(''); setSuccess(''); }}>
            <i className="fas fa-columns"></i> Inicio / Progreso
          </button>
          <button className={`eps-menu-item ${section === 'acta' ? 'active' : ''}`} onClick={() => { setSection('acta'); setError(''); setSuccess(''); }}>
            <i className="fas fa-file-signature"></i> 1. Acta de Inicio
          </button>
          <button className={`eps-menu-item ${section === 'plan' ? 'active' : ''}`} onClick={() => { setSection('plan'); setError(''); setSuccess(''); }}>
            <i className="fas fa-tasks"></i> 2. Plan de Trabajo
          </button>
          <button className={`eps-menu-item ${section === 'bitacoras' ? 'active' : ''}`} onClick={() => { setSection('bitacoras'); setError(''); setSuccess(''); }}>
            <i className="fas fa-history"></i> 3. Bitácoras Semanales
          </button>
          <button className={`eps-menu-item ${section === 'evaluaciones' ? 'active' : ''}`} onClick={() => { setSection('evaluaciones'); setError(''); setSuccess(''); }}>
            <i className="fas fa-graduation-cap"></i> 4. Notas Cuantitativas
          </button>
          <button 
            className="eps-menu-item"
            style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)' }}
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('/login');
            }}
          >
            <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
          </button>
        </nav>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="eps-main">
        
        {/* HEADER */}
        <header className="eps-header">
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
            {section === 'dashboard' && 'Control de Pasantía Profesional'}
            {section === 'acta' && 'Formulario: Acta de Inicio (PE-PCA-F-005)'}
            {section === 'plan' && 'Formulario: Plan de Trabajo de Prácticas (PM-PSO-F-002)'}
            {section === 'bitacoras' && 'Bitácora Semanal de Horas de Práctica'}
            {section === 'evaluaciones' && 'Calificaciones del Anexo 2'}
          </h1>
          <div className="eps-user-badge">
            <div className="eps-user-avatar">{user ? user.name.charAt(0).toUpperCase() : 'E'}</div>
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user ? user.name : ''}</span>
          </div>
        </header>

        {/* CONTENT */}
        <div className="eps-content">
          
          {/* FEEDBACK BANNERS */}
          {error && (
            <div style={{ backgroundColor: '#fee2e2', borderLeft: '4px solid #ef4444', color: '#b91c1c', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', fontWeight: 500 }}>
              <i className="fas fa-exclamation-triangle"></i> {error}
            </div>
          )}

          {success && (
            <div style={{ backgroundColor: '#dcfce7', borderLeft: '4px solid #10b981', color: '#15803d', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', fontWeight: 500 }}>
              <i className="fas fa-check-circle"></i> {success}
            </div>
          )}

          {/* NO ACTIVE PASANTIA HANDLER */}
          {!pasantia ? (
            <div className="eps-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <i className="fas fa-exclamation-circle" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '1rem' }}></i>
              <h3>Sin Pasantía Registrada</h3>
              <p style={{ color: 'var(--eps-text-muted)' }}>Actualmente no tienes un módulo de Pasantías Profesionales activo asignado por el administrador de la FET.</p>
            </div>
          ) : (
            <>
              {/* SECTION: DASHBOARD */}
              {section === 'dashboard' && (
                <>
                  {/* Stats */}
                  <div className="eps-stats-grid">
                    <div className="eps-stat-card">
                      <div>
                        <h4>Horas Aprobadas</h4>
                        <p>{totalHorasAprobadas} / 384 hs</p>
                      </div>
                      <i className="fas fa-clock" style={{ fontSize: '1.75rem', color: 'var(--eps-primary)' }}></i>
                    </div>
                    <div className="eps-stat-card">
                      <div>
                        <h4>Tutor Académico</h4>
                        <p style={{ fontSize: '1rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{pasantia.tutor_nombre || 'No asignado'}</p>
                      </div>
                      <i className="fas fa-user-tie" style={{ fontSize: '1.75rem', color: 'var(--eps-secondary)' }}></i>
                    </div>
                    <div className="eps-stat-card">
                      <div>
                        <h4>Empresa Practicante</h4>
                        <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{pasantia.empresa}</p>
                      </div>
                      <i className="fas fa-briefcase" style={{ fontSize: '1.75rem', color: '#8b5cf6' }}></i>
                    </div>
                    <div className="eps-stat-card">
                      <div>
                        <h4>Estado del Proceso</h4>
                        <p>{estadoBadge(pasantia.estado)}</p>
                      </div>
                      <i className="fas fa-traffic-light" style={{ fontSize: '1.75rem', color: '#f59e0b' }}></i>
                    </div>
                    <div className="eps-stat-card">
                      <div>
                        <h4>Nota Final (Min 3.5)</h4>
                        {(() => {
                          const c1 = evaluaciones.find(x => x.corte === 1);
                          const c2 = evaluaciones.find(x => x.corte === 2);
                          const displayNota = pasantia.nota_final || (c1 && c2 ? (parseFloat(c1.nota_corte) * 0.40) + (parseFloat(c2.nota_corte) * 0.60) : null);
                          if (displayNota !== null) {
                            const val = parseFloat(displayNota);
                            return (
                              <p style={{ 
                                fontSize: '1.25rem', 
                                fontWeight: 900, 
                                color: val >= 3.5 ? '#10b981' : '#ef4444' 
                              }}>
                                {val.toFixed(2)} {val >= 3.5 ? '🎉' : '❌'}
                              </p>
                            );
                          }
                          return <p style={{ fontSize: '0.85rem', color: 'var(--eps-text-muted)', fontStyle: 'italic' }}>Pendiente</p>;
                        })()}
                      </div>
                      <i className="fas fa-graduation-cap" style={{ fontSize: '1.75rem', color: '#10b981' }}></i>
                    </div>
                  </div>

                  {/* Progreso Visual de Horas */}
                  <div className="eps-card" style={{ padding: '2rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>Cumplimiento de las 384 Horas Reglamentarias</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ flex: 1, height: '12px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--eps-primary)', width: `${Math.min(100, (totalHorasAprobadas / 384) * 100)}%` }}></div>
                      </div>
                      <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{((totalHorasAprobadas / 384) * 100).toFixed(1)}%</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--eps-text-muted)', marginTop: '0.75rem' }}>
                      Las bitácoras deben ser debidamente firmadas por ti y aprobadas por tu tutor académico en el sistema para sumar horas al contador final.
                    </p>
                  </div>

                  {/* Firma Digital del Estudiante */}
                  <div className="eps-card" style={{ maxWidth: '600px' }}>
                    <div className="eps-card-header">
                      <h3>Mi Firma Digital para Documentos</h3>
                    </div>
                    <div style={{ padding: '2rem' }}>
                      {firmaEstudianteUrl ? (
                        <div style={{ textAlign: 'center', border: '1px dashed var(--eps-border)', padding: '1rem', borderRadius: '6px', background: '#f8fafc', marginBottom: '1rem' }}>
                          <img src={`http://localhost:8000/uploads/pasantias/firmas/${firmaEstudianteUrl}`} alt="Firma Estudiante" style={{ maxHeight: '80px', objectFit: 'contain' }} />
                          <div style={{ fontSize: '0.7rem', color: 'var(--eps-text-muted)' }}>Firma activa</div>
                        </div>
                      ) : (
                        <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '4px', marginBottom: '1.25rem', fontSize: '0.85rem', fontWeight: 600 }}>
                          <i className="fas fa-exclamation-circle"></i> Aún no registras tu firma. Debe estar registrada para poder firmar las actas y planes de trabajo.
                        </div>
                      )}

                      <form onSubmit={handleSubirFirma} className="eps-form-group">
                        <label>Subir foto de firma manuscrita transparente:</label>
                        <input type="file" accept="image/*" onChange={(e) => setFirmaFile(e.target.files[0])} style={{ padding: '0.25rem', border: '1px solid var(--eps-border)', borderRadius: '4px' }} />
                        <button type="submit" className="eps-btn eps-btn-primary" style={{ marginTop: '1rem', alignSelf: 'flex-start' }} disabled={uploadingFirma || !firmaFile}>
                          {uploadingFirma ? 'Guardando...' : 'Guardar Firma'}
                        </button>
                      </form>
                    </div>
                  </div>
                </>
              )}

              {/* SECTION: ACTA DE INICIO */}
              {section === 'acta' && (
                <div className="eps-card">
                  <div className="eps-card-header">
                    <h3>Acta de Inicio del Proceso de Pasantía</h3>
                    {pasantia.acta_inicio && (
                      <a href={`http://localhost:8000/api/pasantias/${pasantia.id}/pdf/acta`} target="_blank" rel="noreferrer" className="eps-btn eps-btn-success">
                        <i className="fas fa-print"></i> Ver e Imprimir PDF
                      </a>
                    )}
                  </div>
                  <div style={{ padding: '2rem' }}>
                    
                    {!pasantia.acta_inicio ? (
                      <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed var(--eps-border)', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
                        <i className="fas fa-file-signature" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '1.25rem' }}></i>
                        <h4 style={{ color: 'var(--eps-primary)', margin: '0 0 0.5rem 0' }}>Esperando Acta de Inicio</h4>
                        <p style={{ fontSize: '0.95rem', color: 'var(--eps-text-muted)', margin: 0, maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
                          El Docente Tutor es el encargado de diligenciar y registrar los datos de la reunión del Acta de Inicio. Una vez que tu tutor guarde el acta, podrás verla aquí y descargar el PDF institucional.
                        </p>
                      </div>
                    ) : (
                      <div style={{ border: '1px solid #cbd5e1', padding: '1.5rem', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
                        <h4 style={{ color: 'var(--eps-primary)', marginTop: 0 }}>¡Acta de Inicio Registrada por tu Tutor!</h4>
                        <p style={{ fontSize: '0.9rem', color: 'var(--eps-text-muted)', marginBottom: '1.5rem' }}>
                          Los datos de la reunión institucional han sido cargados por tu docente tutor académico.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                          <div className="eps-form-group">
                            <label>Fecha de Reunión</label>
                            <input type="text" className="eps-input" value={actaForm.fecha} disabled />
                          </div>
                          <div className="eps-form-group">
                            <label>Hora de Reunión</label>
                            <input type="text" className="eps-input" value={actaForm.hora} disabled />
                          </div>
                        </div>

                        <div className="eps-form-group" style={{ marginBottom: '1.5rem' }}>
                          <label>Asistentes</label>
                          <textarea className="eps-textarea" value={actaForm.asistentes} disabled />
                        </div>

                        <div className="eps-form-group" style={{ marginBottom: '1.5rem' }}>
                          <label>Orden del Día Estándar:</label>
                          <ul style={{ paddingLeft: '1.5rem', fontSize: '0.9rem', color: 'var(--eps-text-muted)' }}>
                            {actaForm.ordenDiaList.map((x, i) => <li key={i}>{x}</li>)}
                          </ul>
                        </div>

                        <div className="eps-form-group">
                          <label>Desarrollo y Acuerdos de Iniciación:</label>
                          <ul style={{ paddingLeft: '1.5rem', fontSize: '0.9rem', color: 'var(--eps-text-muted)' }}>
                            {actaForm.desarrolloList.map((x, i) => <li key={i}>{x}</li>)}
                          </ul>
                        </div>

                        {!firmaEstudianteUrl ? (
                          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '4px', marginTop: '1.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                            <i className="fas fa-exclamation-circle"></i> Recuerda registrar tu firma digital en la pestaña "Inicio / Progreso" para que se plasme automáticamente en este documento PDF.
                          </div>
                        ) : (
                          <div style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '1rem', borderRadius: '4px', marginTop: '1.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                            <i className="fas fa-check-circle"></i> Tu firma digital ya se encuentra cargada y lista para plasmarse en este documento.
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* SECTION: PLAN DE TRABAJO */}
              {section === 'plan' && (
                <div className="eps-card">
                  <div className="eps-card-header">
                    <h3>Plan de Trabajo de Prácticas</h3>
                    {pasantia.plan_trabajo && (
                      <a href={`http://localhost:8000/api/pasantias/${pasantia.id}/pdf/plan`} target="_blank" rel="noreferrer" className="eps-btn eps-btn-success">
                        <i className="fas fa-print"></i> Ver e Imprimir PDF
                      </a>
                    )}
                  </div>
                  <div style={{ padding: '2rem' }}>
                    
                    {pasantia.plan_trabajo ? (
                      <div>
                        <h4 style={{ color: 'var(--eps-primary)', marginTop: 0 }}>Plan de Trabajo Registrado</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                          <div className="eps-form-group">
                            <label>Nombre del Convenio</label>
                            <input type="text" className="eps-input" value={planForm.nombreConvenio} disabled />
                          </div>
                          <div className="eps-form-group">
                            <label>Duración Pactada</label>
                            <input type="text" className="eps-input" value={planForm.duracion} disabled />
                          </div>
                        </div>

                        <h4>Actividades y Competencias:</h4>
                        <table className="eps-table">
                          <thead>
                            <tr>
                              <th>Competencia a desarrollar</th>
                              <th>Actividad específica</th>
                              <th>Fecha Estimada</th>
                            </tr>
                          </thead>
                          <tbody>
                            {planForm.actividadesList.map((act, i) => (
                              <tr key={i}>
                                <td><strong>{act.competencia}</strong></td>
                                <td>{act.actividad}</td>
                                <td><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{act.fecha}</code></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <form onSubmit={handleGuardarPlan}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                          <div className="eps-form-group">
                            <label>Nombre del Convenio o Empresa Cooperadora</label>
                            <input type="text" className="eps-input" placeholder="Ej: Convenio Marco FET - Empresa Ltda." value={planForm.nombreConvenio} onChange={(e) => setPlanForm({ ...planForm, nombreConvenio: e.target.value })} required />
                          </div>
                          <div className="eps-form-group">
                            <label>Duración del Proceso (Estándar)</label>
                            <input type="text" className="eps-input" value={planForm.duracion} disabled />
                          </div>
                        </div>

                        {/* Renglón para agregar actividades dinámicas */}
                        <div style={{ border: '1px solid var(--eps-border)', padding: '1.5rem', borderRadius: '6px', marginBottom: '1.5rem', backgroundColor: '#f8fafc' }}>
                          <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem' }}>Añadir Competencia / Actividad al Plan:</h4>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 180px', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="eps-form-group" style={{ marginBottom: 0 }}>
                              <label>Competencia a Desarrollar</label>
                              <input type="text" className="eps-input" placeholder="Ej: Liderazgo y desarrollo de software" value={planForm.competencia} onChange={(e) => setPlanForm({ ...planForm, competencia: e.target.value })} />
                            </div>
                            <div className="eps-form-group" style={{ marginBottom: 0 }}>
                              <label>Actividad Específica</label>
                              <input type="text" className="eps-input" placeholder="Ej: Desarrollo de interfaces Web React" value={planForm.actividad} onChange={(e) => setPlanForm({ ...planForm, actividad: e.target.value })} />
                            </div>
                            <div className="eps-form-group" style={{ marginBottom: 0 }}>
                              <label>Fecha Estimada</label>
                              <input type="date" className="eps-input" value={planForm.fecha} onChange={(e) => setPlanForm({ ...planForm, fecha: e.target.value })} />
                            </div>
                          </div>

                          <button 
                            type="button" 
                            className="eps-btn eps-btn-outline"
                            onClick={() => {
                              if (!planForm.competencia || !planForm.actividad || !planForm.fecha) {
                                alert('Completa los tres campos de la actividad antes de añadirla.');
                                return;
                              }
                              setPlanForm(prev => ({
                                ...prev,
                                competencia: '',
                                actividad: '',
                                fecha: '',
                                actividadesList: [...prev.actividadesList, {
                                  competencia: prev.competencia,
                                  actividad: prev.actividad,
                                  fecha: prev.fecha
                                }]
                              }));
                            }}
                          >
                            <i className="fas fa-plus"></i> Añadir Fila de Actividad
                          </button>
                        </div>

                        {/* Listado temporal de actividades agregadas */}
                        {planForm.actividadesList.length > 0 && (
                          <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ fontSize: '0.9rem' }}>Actividades Añadidas al Plan:</h4>
                            <table className="eps-table">
                              <thead>
                                <tr>
                                  <th>Competencia</th>
                                  <th>Actividad</th>
                                  <th>Fecha</th>
                                  <th>Eliminar</th>
                                </tr>
                              </thead>
                              <tbody>
                                {planForm.actividadesList.map((x, i) => (
                                  <tr key={i}>
                                    <td><strong>{x.competencia}</strong></td>
                                    <td>{x.actividad}</td>
                                    <td><code>{x.fecha}</code></td>
                                    <td>
                                      <button 
                                        type="button" 
                                        style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}
                                        onClick={() => {
                                          setPlanForm({
                                            ...planForm,
                                            actividadesList: planForm.actividadesList.filter((_, idx) => idx !== i)
                                          });
                                        }}
                                      >
                                        <i className="fas fa-trash"></i>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {!firmaEstudianteUrl ? (
                          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '4px', margin: '1.5rem 0', fontSize: '0.85rem', fontWeight: 600 }}>
                            <i className="fas fa-lock"></i> Debes subir tu firma digital en la sección "Inicio" antes de poder registrar y enviar el Plan de Trabajo.
                          </div>
                        ) : (
                          <button type="submit" className="eps-btn eps-btn-primary" style={{ padding: '0.75rem 2rem' }} disabled={planForm.actividadesList.length === 0}>
                            <i className="fas fa-save"></i> Firmar y Guardar Plan de Trabajo
                          </button>
                        )}
                      </form>
                    )}

                  </div>
                </div>
              )}

              {/* SECTION: BITÁCORAS SEMANALES */}
              {section === 'bitacoras' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
                  
                  {/* Bitacoras timelines */}
                  <div className="eps-card">
                    <div className="eps-card-header">
                      <h3>Línea de Tiempo de Bitácoras de Asistencia</h3>
                      <a href={`http://localhost:8000/api/pasantias/${pasantia.id}/excel/asistencia`} className="eps-btn eps-btn-success">
                        <i className="fas fa-file-excel"></i> Exportar Asistencias (.xls)
                      </a>
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                      <div className="eps-timeline">
                        {asistencias.length > 0 ? asistencias.map((asist) => (
                          <div className="eps-tl-item" key={asist.id}>
                            <div className={`eps-tl-badge ${asist.estado === 'aprobado' ? 'completed' : (asist.estado === 'corregir' ? 'correction' : 'pending')}`}>
                              <i className={asist.estado === 'aprobado' ? 'fas fa-check' : (asist.estado === 'corregir' ? 'fas fa-times' : 'fas fa-clock')}></i>
                            </div>
                            <div className="eps-tl-content">
                              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <h4 style={{ margin: 0, fontWeight: 700 }}>Semana {asist.semana}</h4>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--eps-text-muted)' }}>Del {new Date(asist.fecha_inicio).toLocaleDateString('es-CO')} al {new Date(asist.fecha_fin).toLocaleDateString('es-CO')}</span>
                                  {estadoBadge(asist.estado)}
                                </div>
                              </div>
                              <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>
                                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500 }}>Actividad realizada:</p>
                                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '4px', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                                  "{asist.actividad}"
                                </div>
                                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--eps-text-muted)' }}>
                                  <span><strong>Horas:</strong> {asist.horas} hs.</span>
                                  {asist.evidencia && (
                                    <a href={`http://localhost:8000/uploads/pasantias/evidencias/${asist.evidencia}`} target="_blank" rel="noreferrer" style={{ color: 'var(--eps-secondary)', fontWeight: 600 }}>
                                      <i className="fas fa-file-download"></i> Descargar Evidencia Física
                                    </a>
                                  )}
                                </div>

                                {asist.comentario_tutor && (
                                  <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', borderLeft: '3px solid #ef4444', backgroundColor: '#fef2f2', fontSize: '0.85rem' }}>
                                    <strong>Retroalimentación del Tutor:</strong> {asist.comentario_tutor}
                                  </div>
                                )}

                                {asist.estado !== 'aprobado' && (
                                  <button 
                                    className="eps-btn eps-btn-outline" 
                                    style={{ marginTop: '1rem', color: '#ef4444', borderColor: '#fee2e2' }}
                                    onClick={() => handleEliminarAsistencia(asist.id)}
                                  >
                                    <i className="fas fa-trash"></i> Eliminar Registro
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--eps-text-muted)' }}>
                            <i className="fas fa-history" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '1rem' }}></i>
                            <p>Aún no has registrado ninguna bitácora semanal. Utiliza el formulario lateral para enviar tu primer avance.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Form lateral de registro */}
                  <div className="eps-card">
                    <div className="eps-card-header">
                      <h3>Registrar Avance Semanal</h3>
                    </div>
                    <form onSubmit={handleGuardarBitacora} style={{ padding: '1.5rem' }}>
                      <div className="eps-form-group">
                        <label>Número de Semana:</label>
                        <select 
                          className="eps-input" 
                          value={bitacoraForm.semana} 
                          onChange={(e) => setBitacoraForm({ ...bitacoraForm, semana: e.target.value })} 
                          required
                        >
                          <option value="">Seleccionar Semana</option>
                          {[...Array(16)].map((_, i) => (
                            <option key={i+1} value={i+1}>Semana {i+1}</option>
                          ))}
                        </select>
                      </div>

                      <div className="eps-form-group">
                        <label>Fecha de Inicio:</label>
                        <input type="date" className="eps-input" value={bitacoraForm.fecha_inicio} onChange={(e) => setBitacoraForm({ ...bitacoraForm, fecha_inicio: e.target.value })} required />
                      </div>

                      <div className="eps-form-group">
                        <label>Fecha de Fin:</label>
                        <input type="date" className="eps-input" value={bitacoraForm.fecha_fin} onChange={(e) => setBitacoraForm({ ...bitacoraForm, fecha_fin: e.target.value })} required />
                      </div>

                      <div className="eps-form-group">
                        <label>Actividades Desarrolladas:</label>
                        <textarea className="eps-textarea" placeholder="Redacta de manera clara y estructurada lo realizado esta semana..." value={bitacoraForm.actividad} onChange={(e) => setBitacoraForm({ ...bitacoraForm, actividad: e.target.value })} required />
                      </div>

                      <div className="eps-form-group">
                        <label>Número de Horas Laboradas:</label>
                        <input type="number" className="eps-input" placeholder="Ej: 24" value={bitacoraForm.horas} onChange={(e) => setBitacoraForm({ ...bitacoraForm, horas: e.target.value })} required />
                      </div>

                      <div className="eps-form-group">
                        <label>Soporte de Evidencia (PDF o Imagen):</label>
                        <input type="file" accept="image/*,application/pdf" onChange={(e) => setBitacoraForm({ ...bitacoraForm, evidencia: e.target.files[0] })} style={{ fontSize: '0.8rem' }} />
                      </div>

                      <button type="submit" className="eps-btn eps-btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} disabled={submittingBitacora}>
                        {submittingBitacora ? 'Enviando...' : 'Enviar Reporte Semanal'}
                      </button>
                    </form>
                  </div>

                </div>
              )}

              {/* SECTION: NOTAS CUANTITATIVAS */}
              {section === 'evaluaciones' && (
                <div className="eps-card">
                  <div className="eps-card-header">
                    <h3>Seguimiento Cuantitativo (Anexo 2 de Pasantías)</h3>
                  </div>
                  <div style={{ padding: '2rem' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--eps-text-muted)', marginBottom: '2rem' }}>
                      A continuación puedes observar los resultados de tu rúbrica de desempeño evaluada por tu tutor académico tanto en el Corte 1 (40%) como en el Corte 2 (60%).
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                      
                      {[
                        [1, 'Corte 1 - Evaluación del 40%'],
                        [2, 'Corte 2 - Evaluación del 60%']
                      ].map(([corteNum, title]) => {
                        const ev = evaluaciones.find(x => x.corte === corteNum);
                        return (
                          <div className="eps-card" style={{ padding: '1.5rem', border: '1px solid var(--eps-border)', marginBottom: 0 }} key={corteNum}>
                            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--eps-primary)' }}>{title}</h4>
                            
                            {ev ? (
                              <div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Dimensión Actitudinal (25%):</span>
                                    <strong style={{ color: 'var(--eps-primary)' }}>{ev.nota_actitudinal}</strong>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Dimensión Procedimental (35%):</span>
                                    <strong style={{ color: 'var(--eps-primary)' }}>{ev.nota_procedimental}</strong>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Dimensión Cognitiva (40%):</span>
                                    <strong style={{ color: 'var(--eps-primary)' }}>{ev.nota_cognitiva}</strong>
                                  </div>
                                </div>

                                <div style={{ 
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                  backgroundColor: '#dcfce7', padding: '0.75rem', borderRadius: '6px', 
                                  fontWeight: 'bold', fontSize: '1rem', color: '#166534', marginBottom: '1.25rem' 
                                }}>
                                  <span>CALIFICACIÓN TOTAL CORTE:</span>
                                  <span style={{ fontSize: '1.5rem' }}>{ev.nota_corte}</span>
                                </div>

                                {ev.comentarios && (
                                  <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                                    <strong>Retroalimentación del Tutor:</strong> {ev.comentarios}
                                  </div>
                                )}

                                <a 
                                  href={`http://localhost:8000/api/pasantias/${pasantia.id}/pdf/evaluacion/${corteNum}`}
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="eps-btn eps-btn-outline"
                                  style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
                                >
                                  <i className="fas fa-file-pdf"></i> Ver Rúbrica Anexo 2 PDF
                                </a>
                              </div>
                            ) : (
                              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--eps-text-muted)' }}>
                                <i className="fas fa-clock" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '0.5rem' }}></i>
                                <p>Pendiente evaluación por parte de tu tutor académico.</p>
                              </div>
                            )}
                          </div>
                        );
                      })}

                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

      </main>

    </div>
  );
}
