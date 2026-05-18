import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './tutor_pasantias.css';

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
    pendiente: ['tps-badge tps-badge-pending', 'Pendiente'],
    en_curso: ['tps-badge tps-badge-process', 'En Curso'],
    finalizada: ['tps-badge tps-badge-approved', 'Finalizada'],
    rechazada: ['tps-badge tps-badge-rejected', 'Rechazada'],
  };
  const [cls, label] = map[estado] || ['tps-badge tps-badge-pending', estado];
  return <span className={cls}>{label}</span>;
};

export default function TutorPasantias() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [section, setSection] = useState('dashboard'); // 'dashboard', 'bitacoras_pendientes', 'detalle', 'firma_settings'
  const [activeSubTab, setActiveSubTab] = useState('acta'); // 'acta', 'plan', 'bitacora', 'evaluacion', 'descargas'

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [pasantias, setPasantias] = useState([]);
  const [stats, setStats] = useState({ total: 0, finalizadas: 0, en_curso: 0, pendientes: 0, bitacoras_pendientes: 0 });
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Detalle seleccionado
  const [detalle, setDetalle] = useState(null);
  const [asistencias, setAsistencias] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);

  // Firma del Tutor
  const [firmaTutorUrl, setFirmaTutorUrl] = useState('');

  // Modales y Formularios de Calificación Semanal
  const [modalAsistencia, setModalAsistencia] = useState(null);
  const [modalEstado, setModalEstado] = useState('aprobado');
  const [modalComentario, setModalComentario] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Carga de Firmas
  const [firmaTutorFile, setFirmaTutorFile] = useState(null);
  const [firmaSupervisorFile, setFirmaSupervisorFile] = useState(null);
  const [uploadingFirma, setUploadingFirma] = useState(false);

  // Formulario de Evaluación Cuantitativa (Anexo 2)
  const [corteEval, setCorteEval] = useState(1); // 1 = 40%, 2 = 60%
  const [evalForm, setEvalForm] = useState({
    // Actitudinales (9 notas)
    nota_act_1: '', nota_act_2: '', nota_act_3: '',
    nota_act_4: '', nota_act_5: '', nota_act_6: '',
    nota_act_7: '', nota_act_8: '', nota_act_9: '',
    // Procedimentales (9 notas)
    nota_proc_1: '', nota_proc_2: '', nota_proc_3: '',
    nota_proc_4: '', nota_proc_5: '', nota_proc_6: '',
    nota_proc_7: '', nota_proc_8: '', nota_proc_9: '',
    // Cognitivos (6 notas)
    nota_cog_inf_1: '', nota_cog_inf_2: '',
    nota_cog_pro_1: '', nota_cog_pro_2: '',
    nota_cog_dom_1: '', nota_cog_dom_2: '',
    // Observaciones
    comentarios: ''
  });

  // Formulario del Acta de Inicio (Diligenciado por el Tutor)
  const [actaForm, setActaForm] = useState({
    fecha: '',
    hora: '',
    asistentes: '',
    ordenDiaList: [
      'Presentación del Asesor y Estudiante Practicante',
      'Verificación de la asignación horaria de 384 hs',
      'Establecimiento del Plan de Trabajo'
    ],
    desarrolloList: [
      'Se inicia la sesión virtual/presencial procediendo con las firmas correspondientes.',
      'Se acuerdan tutorías quincenales para la revisión de informes y planilla de control de asistencia.'
    ]
  });

  // Auth guard
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user'));
    if (!u || u.rol !== 'tutor') {
      navigate('/login');
      return;
    }
    setUser(u);
    if (u.firma) {
      setFirmaTutorUrl(u.firma);
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API}/tutor/pasantias`, getHeaders());
      if (response.data.success) {
        setPasantias(response.data.pasantias);
        setStats(response.data.stats);
      } else {
        setError(response.data.message);
      }
    } catch (e) {
      setError('Error de red al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const verDetallePasantia = async (id) => {
    setLoading(true);
    setError('');
    try {
      const r = await axios.get(`${API}/tutor/pasantias/${id}`, getHeaders());
      if (r.data.success) {
        setDetalle(r.data.pasantia);
        setAsistencias(r.data.asistencias);
        setEvaluaciones(r.data.evaluaciones);
        setSection('detalle');
        setActiveSubTab('acta');

        // Precargar Acta de Inicio en el formulario del Tutor
        if (r.data.pasantia.acta_inicio) {
          const act = r.data.pasantia.acta_inicio;
          setActaForm({
            fecha: act.fecha || '',
            hora: act.hora || '',
            asistentes: act.asistentes || '',
            ordenDiaList: act.orden_dia || [
              'Presentación del Asesor y Estudiante Practicante',
              'Verificación de la asignación horaria de 384 hs',
              'Establecimiento del Plan de Trabajo'
            ],
            desarrolloList: act.desarrollo || [
              'Se inicia la sesión virtual/presencial procediendo con las firmas correspondientes.',
              'Se acuerdan tutorías quincenales para la revisión de informes y planilla de control de asistencia.'
            ]
          });
        } else {
          const studentName = r.data.pasantia.estudiante_nombre || 'Estudiante';
          const tutorName = r.data.pasantia.tutor_nombre || user?.name || 'Tutor';
          setActaForm({
            fecha: new Date().toISOString().split('T')[0],
            hora: '09:00',
            asistentes: `${studentName}\n${tutorName}`,
            ordenDiaList: [
              'Presentación del Asesor y Estudiante Practicante',
              'Verificación de la asignación horaria de 384 hs',
              'Establecimiento del Plan de Trabajo'
            ],
            desarrolloList: [
              'Se inicia la sesión virtual/presencial procediendo con las firmas correspondientes.',
              'Se acuerdan tutorías quincenales para la revisión de informes y planilla de control de asistencia.'
            ]
          });
        }

        // Limpiar form de evaluación
        cargarEvaluacionCorte(1, r.data.evaluaciones);
      } else {
        setError(r.data.message);
      }
    } catch (e) {
      setError('No se pudo cargar la información de la pasantía.');
    } finally {
      setLoading(false);
    }
  };

  const cargarEvaluacionCorte = (corte, evalsList = evaluaciones) => {
    setCorteEval(corte);
    const ev = evalsList.find(x => x.corte === parseInt(corte));
    if (ev) {
      setEvalForm({
        nota_act_1: ev.nota_act_1 || '',
        nota_act_2: ev.nota_act_2 || '',
        nota_act_3: ev.nota_act_3 || '',
        nota_act_4: ev.nota_act_4 || '',
        nota_act_5: ev.nota_act_5 || '',
        nota_act_6: ev.nota_act_6 || '',
        nota_act_7: ev.nota_act_7 || '',
        nota_act_8: ev.nota_act_8 || '',
        nota_act_9: ev.nota_act_9 || '',
        nota_proc_1: ev.nota_proc_1 || '',
        nota_proc_2: ev.nota_proc_2 || '',
        nota_proc_3: ev.nota_proc_3 || '',
        nota_proc_4: ev.nota_proc_4 || '',
        nota_proc_5: ev.nota_proc_5 || '',
        nota_proc_6: ev.nota_proc_6 || '',
        nota_proc_7: ev.nota_proc_7 || '',
        nota_proc_8: ev.nota_proc_8 || '',
        nota_proc_9: ev.nota_proc_9 || '',
        nota_cog_inf_1: ev.nota_cog_inf_1 || '',
        nota_cog_inf_2: ev.nota_cog_inf_2 || '',
        nota_cog_pro_1: ev.nota_cog_pro_1 || '',
        nota_cog_pro_2: ev.nota_cog_pro_2 || '',
        nota_cog_dom_1: ev.nota_cog_dom_1 || '',
        nota_cog_dom_2: ev.nota_cog_dom_2 || '',
        comentarios: ev.comentarios || ''
      });
    } else {
      setEvalForm({
        nota_act_1: '', nota_act_2: '', nota_act_3: '',
        nota_act_4: '', nota_act_5: '', nota_act_6: '',
        nota_act_7: '', nota_act_8: '', nota_act_9: '',
        nota_proc_1: '', nota_proc_2: '', nota_proc_3: '',
        nota_proc_4: '', nota_proc_5: '', nota_proc_6: '',
        nota_proc_7: '', nota_proc_8: '', nota_proc_9: '',
        nota_cog_inf_1: '', nota_cog_inf_2: '',
        nota_cog_pro_1: '', nota_cog_pro_2: '',
        nota_cog_dom_1: '', nota_cog_dom_2: '',
        comentarios: ''
      });
    }
  };

  const handleSubirFirmaTutor = async (e) => {
    e.preventDefault();
    if (!firmaTutorFile) return;

    setUploadingFirma(true);
    setError('');
    setSuccess('');

    const fd = new FormData();
    fd.append('firma', firmaTutorFile);

    try {
      const response = await axios.post(`${API}/tutor/pasantias/subir-firma`, fd, getHeadersMultipart());
      if (response.data.success) {
        setSuccess('¡Tu firma ha sido guardada correctamente!');
        setFirmaTutorUrl(response.data.firma);
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

  const handleSubirFirmaSupervisor = async (e) => {
    e.preventDefault();
    if (!firmaSupervisorFile || !detalle) return;

    setUploadingFirma(true);
    setError('');
    setSuccess('');

    const fd = new FormData();
    fd.append('firma', firmaSupervisorFile);

    try {
      const response = await axios.post(`${API}/tutor/pasantias/${detalle.id}/subir-firma-supervisor`, fd, getHeadersMultipart());
      if (response.data.success) {
        setSuccess('¡Firma del supervisor guardada!');
        setDetalle({ ...detalle, firma_supervisor: response.data.firma_supervisor });
      } else {
        setError(response.data.message);
      }
    } catch (e) {
      setError('Error al subir la firma.');
    } finally {
      setUploadingFirma(false);
    }
  };

  const submitCalificarAsistencia = async () => {
    if (!modalAsistencia) return;
    setModalLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await axios.post(`${API}/tutor/pasantias/asistencias/calificar`, {
        asistencia_id: modalAsistencia.id,
        estado: modalEstado,
        comentario_tutor: modalComentario
      }, getHeaders());

      if (res.data.success) {
        setSuccess('Reporte calificado correctamente.');
        setModalAsistencia(null);
        // Recargar detalle
        verDetallePasantia(detalle.id);
        loadData();
      } else {
        setError(res.data.message);
      }
    } catch (e) {
      setError('Error de comunicación.');
    } finally {
      setModalLoading(false);
    }
  };

  // Guardar Acta de Inicio (Diligenciado por el Tutor)
  const handleGuardarActa = async (e) => {
    e.preventDefault();
    if (!actaForm.fecha || !actaForm.hora || !actaForm.asistentes) {
      setError('Por favor completa todos los campos del acta.');
      return;
    }

    setModalLoading(true);
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

      const res = await axios.post(`${API}/tutor/pasantias/${detalle.id}/guardar-acta`, payload, getHeaders());
      if (res.data.success) {
        setSuccess('¡Acta de Inicio guardada correctamente!');
        // Recargar detalle pasantía
        const r = await axios.get(`${API}/tutor/pasantias/${detalle.id}`, getHeaders());
        if (r.data.success) {
          setDetalle(r.data.pasantia);
        }
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError('No se pudo guardar el Acta de Inicio.');
    } finally {
      setModalLoading(false);
    }
  };

  // Cálculo de Amedidas Cuantitativas
  const calcPromedio = (fields) => {
    let sum = 0;
    let count = 0;
    fields.forEach(f => {
      const val = parseFloat(evalForm[f]);
      if (!isNaN(val)) {
        sum += val;
        count++;
      }
    });
    return count > 0 ? (sum / count).toFixed(2) : '0.00';
  };

  const actitudinalFields = ['nota_act_1', 'nota_act_2', 'nota_act_3', 'nota_act_4', 'nota_act_5', 'nota_act_6', 'nota_act_7', 'nota_act_8', 'nota_act_9'];
  const procedimentalFields = ['nota_proc_1', 'nota_proc_2', 'nota_proc_3', 'nota_proc_4', 'nota_proc_5', 'nota_proc_6', 'nota_proc_7', 'nota_proc_8', 'nota_proc_9'];
  const cognitivaFields = ['nota_cog_inf_1', 'nota_cog_inf_2', 'nota_cog_pro_1', 'nota_cog_pro_2', 'nota_cog_dom_1', 'nota_cog_dom_2'];

  const promActitudinal = calcPromedio(actitudinalFields);
  const promProcedimental = calcPromedio(procedimentalFields);
  const promCognitiva = calcPromedio(cognitivaFields);

  const notaCorteTotal = (
    parseFloat(promActitudinal) * 0.25 +
    parseFloat(promProcedimental) * 0.35 +
    parseFloat(promCognitiva) * 0.40
  ).toFixed(2);

  const isReadOnly = evaluaciones.some(x => x.corte === parseInt(corteEval));

  const handleGradeChange = (field, val) => {
    // Reemplazar coma por punto y validar rango 1.0 a 5.0
    let clean = val.replace(',', '.');
    if (clean !== '' && (isNaN(parseFloat(clean)) || parseFloat(clean) > 5.0 || parseFloat(clean) < 0)) {
      return; // No actualizar si sobrepasa límites
    }
    setEvalForm({ ...evalForm, [field]: clean });
  };

  const submitEvaluacion = async (e) => {
    e.preventDefault();
    if (!detalle) return;

    // Validar que se hayan llenado todas las notas
    const allFields = [...actitudinalFields, ...procedimentalFields, ...cognitivaFields];
    const missing = allFields.some(f => evalForm[f] === '');
    if (missing) {
      setError('Por favor, ingresa una calificación (de 1.0 a 5.0) para todos los criterios antes de guardar.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const dataPayload = {
        pasantia_id: detalle.id,
        corte: corteEval,
        ...evalForm
      };

      const response = await axios.post(`${API}/tutor/pasantias/evaluaciones/calificar`, dataPayload, getHeaders());
      if (response.data.success) {
        setSuccess(response.data.message);
        verDetallePasantia(detalle.id);
      } else {
        setError(response.data.message);
      }
    } catch (e) {
      setError('Error al registrar la calificación.');
    } finally {
      setLoading(false);
    }
  };

  // Filtrado de estudiantes
  const pasantiasFiltradas = pasantias.filter(p => {
    const matchSearch = p.estudiante_nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.empresa.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filterEstado === '' ? true : p.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  return (
    <div className="tps-wrapper">

      {/* SIDEBAR */}
      <aside className="tps-sidebar">
        <div className="tps-sidebar-header">
          <img src="/IMG/logofet.png" alt="FET Logo" className="tps-sidebar-logo" />
          <h2 style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '0.05em', margin: 0 }}>PANEL PASANTÍAS</h2>
        </div>
        <nav className="tps-sidebar-menu">
          <button
            className={`tps-menu-item ${section === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setSection('dashboard'); setError(''); setSuccess(''); }}
          >
            <i className="fas fa-chart-line"></i> Control General
          </button>
          <button
            className={`tps-menu-item ${section === 'firma_settings' ? 'active' : ''}`}
            onClick={() => { setSection('firma_settings'); setError(''); setSuccess(''); }}
          >
            <i className="fas fa-signature"></i> Mi Firma Digital
          </button>
          <button
            className="tps-menu-item"
            style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)' }}
            onClick={() => navigate('/tutor/dashboard')}
          >
            <i className="fas fa-home"></i> Regresar al Portal
          </button>
        </nav>
        
      </aside>

      {/* MAIN CONTAINER */}
      <main className="tps-main">

        {/* HEADER */}
        <header className="tps-header">
          <div className="tps-header-left">
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--tps-text-main)', margin: 0 }}>
              {section === 'dashboard' && 'Seguimiento de Pasantías Profesionales'}
              {section === 'firma_settings' && 'Configuración de Firma Digital'}
              {section === 'detalle' && 'Expediente e Historial del Pasante'}
            </h1>
          </div>
          <div className="tps-header-right">
            <div className="tps-user-badge">
              <div className="tps-user-avatar">
                {user ? user.name.charAt(0).toUpperCase() : 'T'}
              </div>
              <span className="tps-user-name">{user ? user.name : 'Cargando...'}</span>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="tps-content">

          {/* FEEDBACK BANNERS */}
          {error && (
            <div style={{
              backgroundColor: '#fee2e2', borderLeft: '4px solid #ef4444', color: '#b91c1c',
              padding: '1rem', borderRadius: '0.375rem', marginBottom: '1.5rem', fontWeight: 500
            }}>
              <i className="fas fa-exclamation-triangle"></i> {error}
            </div>
          )}

          {success && (
            <div style={{
              backgroundColor: '#dcfce7', borderLeft: '4px solid #10b981', color: '#15803d',
              padding: '1rem', borderRadius: '0.375rem', marginBottom: '1.5rem', fontWeight: 500
            }}>
              <i className="fas fa-check-circle"></i> {success}
            </div>
          )}

          {/* SECTION: DASHBOARD */}
          {section === 'dashboard' && (
            <>
              {/* Estadísticas */}
              <div className="tps-stats-grid">
                <div className="tps-stat-card">
                  <div className="tps-stat-info">
                    <h4>Total Pasantías</h4>
                    <p>{stats.total}</p>
                  </div>
                  <div className="tps-stat-icon primary"><i className="fas fa-users"></i></div>
                </div>
                <div className="tps-stat-card">
                  <div className="tps-stat-info">
                    <h4>En Curso</h4>
                    <p>{stats.en_curso}</p>
                  </div>
                  <div className="tps-stat-icon secondary"><i className="fas fa-spinner fa-spin"></i></div>
                </div>
                <div className="tps-stat-card">
                  <div className="tps-stat-info">
                    <h4>Revisión Pendiente</h4>
                    <p>{stats.bitacoras_pendientes}</p>
                  </div>
                  <div className="tps-stat-icon warning"><i className="fas fa-clock"></i></div>
                </div>
                <div className="tps-stat-card">
                  <div className="tps-stat-info">
                    <h4>Finalizadas</h4>
                    <p>{stats.finalizadas}</p>
                  </div>
                  <div className="tps-stat-icon success"><i className="fas fa-graduation-cap"></i></div>
                </div>
              </div>

              {/* Listado Principal de Alumnos */}
              <div className="tps-card">
                <div className="tps-card-header">
                  <h3>Pasantes Asignados</h3>
                  <div className="tps-filters">
                    <input
                      type="text"
                      placeholder="Buscar por estudiante o empresa..."
                      className="tps-search-input"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                      className="tps-select"
                      value={filterEstado}
                      onChange={(e) => setFilterEstado(e.target.value)}
                    >
                      <option value="">Todos los Estados</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="en_curso">En Curso</option>
                      <option value="finalizada">Finalizada</option>
                    </select>
                  </div>
                </div>

                <div className="tps-table-container">
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                      <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--tps-primary)' }}></i>
                      <p style={{ marginTop: '0.75rem', color: 'var(--tps-text-muted)' }}>Cargando pasantes...</p>
                    </div>
                  ) : pasantiasFiltradas.length > 0 ? (
                    <table className="tps-table">
                      <thead>
                        <tr>
                          <th>Estudiante</th>
                          <th>Código</th>
                          <th>Empresa / Agencia</th>
                          <th>Horas Validadas</th>
                          <th>Estado</th>
                          <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pasantiasFiltradas.map(p => (
                          <tr key={p.id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{p.estudiante_nombre}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--tps-text-muted)' }}>{p.estudiante_email}</div>
                            </td>
                            <td><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{p.codigo_estudiante}</code></td>
                            <td>
                              <div style={{ fontWeight: 500 }}>{p.empresa}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--tps-text-muted)' }}>Cargo: {p.cargo}</div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{
                                  background: '#e2e8f0', width: '80px', height: '6px',
                                  borderRadius: '3px', overflow: 'hidden'
                                }}>
                                  <div style={{
                                    background: 'var(--tps-primary)', height: '100%',
                                    width: `${Math.min(100, (p.horas_aprobadas / 384) * 100)}%`
                                  }}></div>
                                </div>
                                <span style={{ fontWeight: 'bold' }}>{p.horas_aprobadas} / 384 hs</span>
                              </div>
                            </td>
                            <td>{estadoBadge(p.estado)}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="tps-btn tps-btn-primary"
                                onClick={() => verDetallePasantia(p.id)}
                              >
                                <i className="fas fa-folder-open"></i> Expediente
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="tps-empty">
                      <i className="fas fa-users-slash"></i>
                      <p>No se encontraron pasantes asignados con los filtros aplicados.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* SECTION: MI FIRMA DIGITAL */}
          {section === 'firma_settings' && (
            <div className="tps-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div className="tps-card-header">
                <h3>Mi Firma para Actas y Calificaciones</h3>
              </div>
              <div style={{ padding: '2rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--tps-text-muted)', marginBottom: '1.5rem' }}>
                  Sube una foto clara de tu firma manuscrita (preferiblemente sobre fondo blanco o transparente). Esta firma se plasmará automáticamente en formato digital en las Actas de Inicio, Planes de Trabajo y Evaluaciones de tus estudiantes evaluados.
                </p>

                {firmaTutorUrl ? (
                  <div style={{
                    textAlign: 'center', border: '1px dashed var(--tps-border)',
                    padding: '1.5rem', borderRadius: 'var(--tps-radius)', marginBottom: '1.5rem',
                    background: '#f8fafc'
                  }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--tps-text-muted)', display: 'block', marginBottom: '0.5rem' }}>FIRMA ACTUAL REGISTRADA:</label>
                    <img
                      src={`http://localhost:8000/uploads/pasantias/firmas/${firmaTutorUrl}`}
                      alt="Firma Tutor"
                      style={{ maxHeight: '100px', objectFit: 'contain' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center', border: '1px dashed #ef4444', color: '#b91c1c',
                    padding: '1.5rem', borderRadius: 'var(--tps-radius)', marginBottom: '1.5rem',
                    background: '#fee2e2', fontSize: '0.9rem', fontWeight: 600
                  }}>
                    <i className="fas fa-signature"></i> Aún no has registrado tu firma digital. Sube una a continuación.
                  </div>
                )}

                <form onSubmit={handleSubirFirmaTutor} className="tps-form-group">
                  <label>Seleccionar Archivo de Imagen:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFirmaTutorFile(e.target.files[0])}
                    style={{ padding: '0.5rem', border: '1px solid var(--tps-border)', borderRadius: '0.375rem' }}
                  />
                  <button
                    type="submit"
                    className="tps-btn tps-btn-primary"
                    style={{ marginTop: '1rem', alignSelf: 'flex-start' }}
                    disabled={uploadingFirma || !firmaTutorFile}
                  >
                    {uploadingFirma ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-upload"></i>} Guardar Firma
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* SECTION: DETALLE DE PASANTÍA */}
          {section === 'detalle' && detalle && (
            <div className="tps-detail-grid">

              {/* Tarjeta lateral con perfil */}
              <div className="tps-sidebar-card">
                <div className="tps-avatar-circle">
                  {detalle.estudiante_nombre.charAt(0).toUpperCase()}
                </div>
                <h4>{detalle.estudiante_nombre}</h4>
                <p>Estudiante Practicante</p>

                <div className="tps-meta-list">
                  <div className="tps-meta-item">
                    <label>Código Estudiantil</label>
                    <span>{detalle.codigo_estudiante}</span>
                  </div>
                  <div className="tps-meta-item">
                    <label>Identificación</label>
                    <span>{detalle.estudiante_documento}</span>
                  </div>
                  <div className="tps-meta-item">
                    <label>Programa Académico</label>
                    <span>Ingeniería / Tecnología de Software</span>
                  </div>
                  <div className="tps-meta-item">
                    <label>Semestre / Ciclo</label>
                    <span>Ciclo {detalle.ciclo || '—'}</span>
                  </div>
                  <div className="tps-meta-item">
                    <label>Empresa de Práctica</label>
                    <span style={{ color: 'var(--tps-primary)', fontWeight: 'bold' }}>{detalle.empresa}</span>
                  </div>
                  <div className="tps-meta-item">
                    <label>Supervisor Empresarial</label>
                    <span>{detalle.supervisor_empresa || 'Pendiente registrar'}</span>
                  </div>
                  <div className="tps-meta-item">
                    <label>Total Horas Validadas</label>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--tps-primary)' }}>
                      {asistencias.filter(x => x.estado === 'aprobado').reduce((acc, curr) => acc + parseFloat(curr.horas), 0)} / 384 hs
                    </span>
                  </div>
                  <div className="tps-meta-item">
                    <label>Nota Final Pasantía (Min 3.50)</label>
                    {(() => {
                      const c1 = evaluaciones.find(x => x.corte === 1);
                      const c2 = evaluaciones.find(x => x.corte === 2);
                      const displayNota = detalle.nota_final || (c1 && c2 ? (parseFloat(c1.nota_corte) * 0.40) + (parseFloat(c2.nota_corte) * 0.60) : null);

                      if (displayNota !== null) {
                        const val = parseFloat(displayNota);
                        return (
                          <span style={{
                            fontSize: '1.2rem',
                            fontWeight: 900,
                            color: val >= 3.5 ? '#16a34a' : '#dc2626'
                          }}>
                            {val.toFixed(2)} {val >= 3.5 ? '🎉 (Aprobado)' : '❌ (Reprobado)'}
                          </span>
                        );
                      } else {
                        const c1Grade = evaluaciones.find(x => x.corte === 1);
                        return (
                          <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.85rem' }}>
                            {c1Grade ? `Corte 1: ${parseFloat(c1Grade.nota_corte).toFixed(2)} (Pendiente Corte 2)` : 'Pendiente Calificar'}
                          </span>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>

              {/* Panel principal de navegación */}
              <div style={{ flex: 1 }}>

                {/* Botón Volver */}
                <button
                  className="tps-btn tps-btn-outline"
                  onClick={() => { setSection('dashboard'); setDetalle(null); setError(''); setSuccess(''); }}
                  style={{ marginBottom: '1.5rem' }}
                >
                  <i className="fas fa-arrow-left"></i> Volver a la Lista
                </button>

                {/* Sub-pestañas */}
                <div className="tps-tabs">
                  <button className={`tps-tab-btn ${activeSubTab === 'acta' ? 'active' : ''}`} onClick={() => { setActiveSubTab('acta'); setError(''); setSuccess(''); }}>1. Acta de Inicio</button>
                  <button className={`tps-tab-btn ${activeSubTab === 'plan' ? 'active' : ''}`} onClick={() => { setActiveSubTab('plan'); setError(''); setSuccess(''); }}>2. Plan de Trabajo</button>
                  <button className={`tps-tab-btn ${activeSubTab === 'bitacora' ? 'active' : ''}`} onClick={() => { setActiveSubTab('bitacora'); setError(''); setSuccess(''); }}>3. Control Asistencia</button>
                  <button className={`tps-tab-btn ${activeSubTab === 'evaluacion' ? 'active' : ''}`} onClick={() => { setActiveSubTab('evaluacion'); setError(''); setSuccess(''); cargarEvaluacionCorte(1); }}>4. Seguimiento Cuantitativo</button>
                  <button className={`tps-tab-btn ${activeSubTab === 'descargas' ? 'active' : ''}`} onClick={() => { setActiveSubTab('descargas'); setError(''); setSuccess(''); }}>5. Exportaciones / PDF</button>
                </div>

                {/* CONTENIDO PESTAÑA: ACTA DE INICIO */}
                {activeSubTab === 'acta' && (
                  <div className="tps-card">
                    <div className="tps-card-header">
                      <h3>Acta de Inicio (PE-PCA-F-005)</h3>
                      {detalle.acta_inicio ? (
                        <a
                          href={`http://localhost:8000/api/pasantias/${detalle.id}/pdf/acta`}
                          target="_blank"
                          rel="noreferrer"
                          className="tps-btn tps-btn-success"
                        >
                          <i className="fas fa-print"></i> Ver e Imprimir Acta
                        </a>
                      ) : null}
                    </div>
                    <div style={{ padding: '2rem' }}>
                      {detalle.acta_inicio ? (
                        <div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div className="tps-meta-item">
                              <label>Fecha de Reunión</label>
                              <span style={{ fontWeight: 'bold' }}>{detalle.acta_inicio.fecha}</span>
                            </div>
                            <div className="tps-meta-item">
                              <label>Hora de Reunión</label>
                              <span style={{ fontWeight: 'bold' }}>{detalle.acta_inicio.hora}</span>
                            </div>
                          </div>

                          <div className="tps-meta-item" style={{ marginBottom: '1.5rem' }}>
                            <label>Asistentes a la firma</label>
                            <span style={{ whiteSpace: 'pre-line', background: '#f8fafc', padding: '1rem', borderRadius: '4px' }}>
                              {detalle.acta_inicio.asistentes}
                            </span>
                          </div>

                          <div className="tps-meta-item" style={{ marginBottom: '1.5rem' }}>
                            <label>Orden del Día</label>
                            <ol style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
                              {detalle.acta_inicio.orden_dia && detalle.acta_inicio.orden_dia.map((x, i) => <li key={i}>{x}</li>)}
                            </ol>
                          </div>

                          <div className="tps-meta-item">
                            <label>Desarrollo y Acuerdos de Iniciación</label>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '4px', whiteSpace: 'pre-line', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                              {detalle.acta_inicio.desarrollo && detalle.acta_inicio.desarrollo.map((x, i) => (
                                <p key={i}><strong>{i + 1}.</strong> {x}</p>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleGuardarActa}>
                          <p style={{ color: 'var(--tps-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Como Docente Tutor Académico, debes diligenciar y registrar los datos iniciales de la reunión de concertación de prácticas para generar el Acta de Inicio oficial (PE-PCA-F-005).
                          </p>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div className="tps-meta-item">
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Fecha de Reunión</label>
                              <input
                                type="date"
                                className="tps-input"
                                value={actaForm.fecha}
                                onChange={(e) => setActaForm({ ...actaForm, fecha: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                required
                              />
                            </div>
                            <div className="tps-meta-item">
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Hora de Reunión</label>
                              <input
                                type="time"
                                className="tps-input"
                                value={actaForm.hora}
                                onChange={(e) => setActaForm({ ...actaForm, hora: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                required
                              />
                            </div>
                          </div>

                          <div className="tps-meta-item" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Asistentes a la firma</label>
                            <textarea
                              className="tps-textarea"
                              rows={3}
                              placeholder="Nombre del estudiante, tutor y otros asistentes..."
                              value={actaForm.asistentes}
                              onChange={(e) => setActaForm({ ...actaForm, asistentes: e.target.value })}
                              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }}
                              required
                            />
                          </div>

                          <div className="tps-meta-item" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Orden del Día Estándar</label>
                            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: '#475569' }}>
                              {actaForm.ordenDiaList.map((x, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{x}</li>)}
                            </ul>
                          </div>

                          <div className="tps-meta-item" style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Desarrollo y Acuerdos de Iniciación Estándar</label>
                            <ol style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: '#475569' }}>
                              {actaForm.desarrolloList.map((x, i) => <li key={i} style={{ marginBottom: '0.5rem' }}>{x}</li>)}
                            </ol>
                          </div>

                          {!firmaTutorUrl ? (
                            <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                              <i className="fas fa-lock"></i> Debes tener registrada tu firma digital en tu perfil de tutor antes de poder guardar y firmar el Acta de Inicio institucional.
                            </div>
                          ) : (
                            <button type="submit" className="tps-btn tps-btn-primary" style={{ padding: '0.75rem 2rem' }}>
                              <i className="fas fa-save"></i> Guardar y Firmar Acta de Inicio
                            </button>
                          )}
                        </form>
                      )}
                    </div>
                  </div>
                )}

                {/* CONTENIDO PESTAÑA: PLAN DE TRABAJO */}
                {activeSubTab === 'plan' && (
                  <div className="tps-card">
                    <div className="tps-card-header">
                      <h3>Plan de Trabajo de Prácticas (PM-PSO-F-002)</h3>
                      {detalle.plan_trabajo ? (
                        <a
                          href={`http://localhost:8000/api/pasantias/${detalle.id}/pdf/plan`}
                          target="_blank"
                          rel="noreferrer"
                          className="tps-btn tps-btn-success"
                        >
                          <i className="fas fa-print"></i> Ver e Imprimir Plan
                        </a>
                      ) : null}
                    </div>
                    <div style={{ padding: '2rem' }}>
                      {detalle.plan_trabajo ? (
                        <div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div className="tps-meta-item">
                              <label>Nombre del Convenio</label>
                              <span style={{ fontWeight: 'bold' }}>{detalle.plan_trabajo.nombre_convenio}</span>
                            </div>
                            <div className="tps-meta-item">
                              <label>Duración Pactada</label>
                              <span>{detalle.plan_trabajo.duracion || '384 Horas'}</span>
                            </div>
                          </div>

                          <div className="tps-card" style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: '1.5rem' }}>
                            <h4 style={{ color: '#166534', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <i className="fas fa-signature"></i> Firma del Asesor / Supervisor Empresarial
                            </h4>
                            <p style={{ fontSize: '0.85rem', color: '#166534', margin: '0 0 1rem 0' }}>
                              Para finalizar este documento institucional, el tutor debe adjuntar la firma del supervisor de la empresa.
                            </p>

                            {detalle.firma_supervisor ? (
                              <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '0.75rem', borderRadius: '4px', display: 'inline-block' }}>
                                <img
                                  src={`http://localhost:8000/uploads/pasantias/firmas/${detalle.firma_supervisor}`}
                                  alt="Firma Supervisor"
                                  style={{ maxHeight: '60px' }}
                                />
                                <div style={{ fontSize: '0.7rem', color: 'var(--tps-text-muted)', textAlign: 'center' }}>Firma cargada</div>
                              </div>
                            ) : (
                              <form onSubmit={handleSubirFirmaSupervisor} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => setFirmaSupervisorFile(e.target.files[0])}
                                  style={{ padding: '0.25rem', border: '1px solid var(--tps-border)', borderRadius: '4px', background: '#fff' }}
                                />
                                <button type="submit" className="tps-btn tps-btn-primary" disabled={uploadingFirma || !firmaSupervisorFile}>
                                  Cargar Firma Supervisor
                                </button>
                              </form>
                            )}
                          </div>

                          <h4>Actividades y Competencias Estructuradas:</h4>
                          <table className="tps-table" style={{ marginTop: '0.75rem' }}>
                            <thead>
                              <tr>
                                <th>Competencia a desarrollar</th>
                                <th>Actividad específica</th>
                                <th>Fecha Estimada</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detalle.plan_trabajo.actividades && detalle.plan_trabajo.actividades.map((act, i) => (
                                <tr key={i}>
                                  <td style={{ fontWeight: 600 }}>{act.competencia}</td>
                                  <td>{act.actividad}</td>
                                  <td><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{act.fecha}</code></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--tps-text-muted)' }}>
                          <i className="fas fa-tasks" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '1rem' }}></i>
                          <p>El estudiante aún no ha enviado el Plan de Trabajo.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* CONTENIDO PESTAÑA: CONTROL DE ASISTENCIA */}
                {activeSubTab === 'bitacora' && (
                  <div className="tps-card">
                    <div className="tps-card-header">
                      <h3>Planilla de Bitácoras de Asistencia</h3>
                      <a
                        href={`http://localhost:8000/api/pasantias/${detalle.id}/excel/asistencia`}
                        className="tps-btn tps-btn-success"
                      >
                        <i className="fas fa-file-excel"></i> Descargar Planilla Excel
                      </a>
                    </div>

                    <div style={{ padding: '1.5rem' }}>
                      <div className="tps-timeline">
                        {asistencias.length > 0 ? asistencias.map((asist) => (
                          <div className="tps-tl-item" key={asist.id}>
                            <div className={`tps-tl-badge ${asist.estado === 'aprobado' ? 'completed' : (asist.estado === 'corregir' ? 'correction' : 'pending')}`}>
                              <i className={asist.estado === 'aprobado' ? 'fas fa-check' : (asist.estado === 'corregir' ? 'fas fa-times' : 'fas fa-clock')}></i>
                            </div>
                            <div className="tps-tl-content">
                              <div className="tps-tl-header">
                                <h4>Semana {asist.semana}</h4>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  <span className="tps-tl-date">Del {new Date(asist.fecha_inicio).toLocaleDateString('es-CO')} al {new Date(asist.fecha_fin).toLocaleDateString('es-CO')}</span>
                                  {estadoBadge(asist.estado)}
                                </div>
                              </div>
                              <div className="tps-tl-body">
                                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500 }}>Actividad desarrollada:</p>
                                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '4px', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                                  "{asist.actividad}"
                                </div>
                                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--tps-text-muted)' }}>
                                  <span><strong>Horas:</strong> {asist.horas} hs.</span>
                                  {asist.evidencia ? (
                                    <a
                                      href={`http://localhost:8000/uploads/pasantias/evidencias/${asist.evidencia}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ color: 'var(--tps-secondary)', fontWeight: 600 }}
                                    >
                                      <i className="fas fa-file-download"></i> Descargar Evidencia Física
                                    </a>
                                  ) : <span>Sin evidencia adjunta</span>}
                                </div>
                                {asist.comentario_tutor && (
                                  <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', borderLeft: '3px solid #ef4444', backgroundColor: '#fef2f2', fontSize: '0.85rem' }}>
                                    <strong>Retroalimentación del Tutor:</strong> {asist.comentario_tutor}
                                  </div>
                                )}
                              </div>

                              {asist.estado === 'pendiente' && (
                                <div className="tps-tl-actions">
                                  <button
                                    className="tps-btn tps-btn-primary"
                                    onClick={() => {
                                      setModalAsistencia(asist);
                                      setModalEstado('aprobado');
                                      setModalComentario('');
                                    }}
                                  >
                                    Aprobar e Incrustar Firma
                                  </button>
                                  <button
                                    className="tps-btn tps-btn-danger"
                                    onClick={() => {
                                      setModalAsistencia(asist);
                                      setModalEstado('corregir');
                                      setModalComentario('');
                                    }}
                                  >
                                    Rechazar / Solicitar Corrección
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )) : (
                          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--tps-text-muted)' }}>
                            <i className="fas fa-history" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '1rem' }}></i>
                            <p>Sin reportes semanales registrados por el estudiante en este momento.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* CONTENIDO PESTAÑA: SEGUIMIENTO CUANTITATIVO */}
                {activeSubTab === 'evaluacion' && (
                  <div className="tps-card">
                    <div className="tps-card-header">
                      <h3>Seguimiento Cuantitativo del Estudiante (Anexo 2)</h3>
                      <div className="tps-filters">
                        <select
                          className="tps-select"
                          value={corteEval}
                          onChange={(e) => cargarEvaluacionCorte(e.target.value)}
                          style={{ fontWeight: 'bold', color: 'var(--tps-primary)' }}
                        >
                          <option value="1">Corte 1 - Evaluación del 40%</option>
                          <option value="2">Corte 2 - Evaluación del 60%</option>
                        </select>

                        {evaluaciones.some(x => x.corte === parseInt(corteEval)) && (
                          <a
                            href={`http://localhost:8000/api/pasantias/${detalle.id}/pdf/evaluacion/${corteEval}`}
                            target="_blank"
                            rel="noreferrer"
                            className="tps-btn tps-btn-success"
                          >
                            <i className="fas fa-print"></i> Descargar Anexo 2 PDF
                          </a>
                        )}
                      </div>
                    </div>

                    <form onSubmit={submitEvaluacion} style={{ padding: '2rem' }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--tps-text-muted)', marginBottom: '1.5rem' }}>
                        Ingrese la puntuación numérica para cada uno de los ítems en un rango de <strong>1.0 a 5.0</strong>. El sistema promediará dinámicamente cada dimensión actitudinal (25%), procedimental (35%) y cognitiva (40%) para calcular la nota final del corte.
                      </p>

                      <table className="tps-eval-table">
                        <thead>
                          <tr>
                            <th style={{ width: '33%' }}>1. Dimensión Actitudinal (25%)</th>
                            <th style={{ width: '33%' }}>2. Dimensión Procedimental (35%)</th>
                            <th style={{ width: '34%' }}>3. Dimensión Cognitiva (40%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {/* Actitudinal */}
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {[
                                  ['nota_act_1', 'Capacidad de cambio y adaptación'],
                                  ['nota_act_2', 'Manejo de comunicación verbal'],
                                  ['nota_act_3', 'Valores y actitud proactiva'],
                                  ['nota_act_4', 'Creatividad e innovación'],
                                  ['nota_act_5', 'Apropiación de funciones'],
                                  ['nota_act_6', 'Trabajo en equipo y cooperación'],
                                  ['nota_act_7', 'Relaciones interpersonales'],
                                  ['nota_act_8', 'Respeto a directivos y compañeros'],
                                  ['nota_act_9', 'Puntualidad y cumplimiento']
                                ].map(([field, label], i) => (
                                  <div key={field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem' }}>{i + 1}. {label}</span>
                                    <input
                                      type="text"
                                      className="tps-eval-input"
                                      placeholder="5.0"
                                      value={evalForm[field]}
                                      onChange={(e) => handleGradeChange(field, e.target.value)}
                                      disabled={isReadOnly}
                                    />
                                  </div>
                                ))}
                                <div style={{ borderTop: '2px solid var(--tps-border)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                  <span>PROMEDIO ACTITUDINAL</span>
                                  <span style={{ color: 'var(--tps-primary)' }}>{promActitudinal}</span>
                                </div>
                              </div>
                            </td>

                            {/* Procedimental */}
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {[
                                  ['nota_proc_1', 'Desarrollo de actividades'],
                                  ['nota_proc_2', 'Liderazgo y comunicación'],
                                  ['nota_proc_3', 'Redacción de informes'],
                                  ['nota_proc_4', 'Uso de comandos verbales'],
                                  ['nota_proc_5', 'Aplica conocimientos'],
                                  ['nota_proc_6', 'Comunicación escrita'],
                                  ['nota_proc_7', 'Habilidad para liderar'],
                                  ['nota_proc_8', 'Coordinar actividades'],
                                  ['nota_proc_9', 'Organizar y gestionar']
                                ].map(([field, label], i) => (
                                  <div key={field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem' }}>{i + 1}. {label}</span>
                                    <input
                                      type="text"
                                      className="tps-eval-input"
                                      placeholder="5.0"
                                      value={evalForm[field]}
                                      onChange={(e) => handleGradeChange(field, e.target.value)}
                                      disabled={isReadOnly}
                                    />
                                  </div>
                                ))}
                                <div style={{ borderTop: '2px solid var(--tps-border)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                  <span>PROMEDIO PROCEDIMENTAL</span>
                                  <span style={{ color: 'var(--tps-primary)' }}>{promProcedimental}</span>
                                </div>
                              </div>
                            </td>

                            {/* Cognitiva */}
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '0.75rem', backgroundColor: '#f1f5f9', padding: '2px 4px' }}>INFORME DE PRÁCTICA</div>
                                {[
                                  ['nota_cog_inf_1', 'Primera entrega informe'],
                                  ['nota_cog_inf_2', 'Entrega informe final']
                                ].map(([field, label]) => (
                                  <div key={field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem' }}>{label}</span>
                                    <input
                                      type="text"
                                      className="tps-eval-input"
                                      placeholder="5.0"
                                      value={evalForm[field]}
                                      onChange={(e) => handleGradeChange(field, e.target.value)}
                                      disabled={isReadOnly}
                                    />
                                  </div>
                                ))}

                                <div style={{ fontWeight: 'bold', fontSize: '0.75rem', backgroundColor: '#f1f5f9', padding: '2px 4px', marginTop: '4px' }}>PROYECTO DE INVESTIGACIÓN</div>
                                {[
                                  ['nota_cog_pro_1', 'Primera entrega proyecto'],
                                  ['nota_cog_pro_2', 'Entrega final proyecto']
                                ].map(([field, label]) => (
                                  <div key={field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem' }}>{label}</span>
                                    <input
                                      type="text"
                                      className="tps-eval-input"
                                      placeholder="5.0"
                                      value={evalForm[field]}
                                      onChange={(e) => handleGradeChange(field, e.target.value)}
                                      disabled={isReadOnly}
                                    />
                                  </div>
                                ))}

                                <div style={{ fontWeight: 'bold', fontSize: '0.75rem', backgroundColor: '#f1f5f9', padding: '2px 4px', marginTop: '4px' }}>DOMINIO CONOCIMIENTOS</div>
                                {[
                                  ['nota_cog_dom_1', 'Revisiones de temas'],
                                  ['nota_cog_dom_2', 'Estudios de caso']
                                ].map(([field, label]) => (
                                  <div key={field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem' }}>{label}</span>
                                    <input
                                      type="text"
                                      className="tps-eval-input"
                                      placeholder="5.0"
                                      value={evalForm[field]}
                                      onChange={(e) => handleGradeChange(field, e.target.value)}
                                      disabled={isReadOnly}
                                    />
                                  </div>
                                ))}

                                <div style={{ borderTop: '2px solid var(--tps-border)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                  <span>PROMEDIO COGNITIVO</span>
                                  <span style={{ color: 'var(--tps-primary)' }}>{promCognitiva}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Caja de Ponderación Final */}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: '#dcfce7', border: '1px solid #86efac',
                        padding: '1.25rem', borderRadius: 'var(--tps-radius)', marginBottom: '1.5rem'
                      }}>
                        <div>
                          <h4 style={{ color: '#166534', margin: 0, fontSize: '1rem', fontWeight: 800 }}>PONDERADO DEFINITIVO DEL CORTE:</h4>
                          <span style={{ fontSize: '0.8rem', color: '#166534' }}>(Actitudinal 25% + Procedimental 35% + Cognitivo 40%)</span>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#166534' }}>
                          {notaCorteTotal}
                        </div>
                      </div>

                      <div className="tps-form-group">
                        <label>Observaciones o Recomendaciones del Tutor Académico:</label>
                        <textarea
                          className="tps-textarea"
                          placeholder="Escriba comentarios específicos para guiar al estudiante..."
                          value={evalForm.comentarios}
                          onChange={(e) => setEvalForm({ ...evalForm, comentarios: e.target.value })}
                          disabled={isReadOnly}
                        />
                      </div>

                      {!isReadOnly ? (
                        <button type="submit" className="tps-btn tps-btn-primary" style={{ padding: '0.75rem 2rem' }}>
                          <i className="fas fa-save"></i> Guardar Calificación del Corte
                        </button>
                      ) : (
                        <div style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '1rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <i className="fas fa-lock" style={{ color: 'var(--tps-primary)' }}></i> Calificación registrada oficialmente en el sistema. No se permiten modificaciones.
                        </div>
                      )}
                    </form>
                  </div>
                )}

                {/* CONTENIDO PESTAÑA: DESCARGAS */}
                {activeSubTab === 'descargas' && (
                  <div className="tps-card">
                    <div className="tps-card-header">
                      <h3>Descargas y Control Documental</h3>
                    </div>
                    <div style={{ padding: '2rem' }}>
                      <p style={{ fontSize: '0.9rem', color: 'var(--tps-text-muted)', marginBottom: '2rem' }}>
                        A continuación, puede acceder a los enlaces de generación e impresión directa de todos los documentos y actas del estudiante regulados por la FET. Al hacer clic, se abrirá una nueva pestaña con los formatos oficiales listos para guardar como PDF o imprimir.
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

                        <div className="tps-card" style={{ padding: '1.5rem', border: '1px solid var(--tps-border)', marginBottom: 0 }}>
                          <h4 style={{ margin: '0 0 0.5rem 0' }}><i className="fas fa-file-pdf" style={{ color: '#ef4444' }}></i> Acta de Inicio</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--tps-text-muted)', margin: '0 0 1rem 0' }}>Formato institucional de apertura y firma del tutor y practicante.</p>
                          <a
                            href={`http://localhost:8000/api/pasantias/${detalle.id}/pdf/acta`}
                            target="_blank"
                            rel="noreferrer"
                            className="tps-btn tps-btn-outline"
                            style={{ width: '100%', justifyContent: 'center' }}
                          >
                            Abrir Documento
                          </a>
                        </div>

                        <div className="tps-card" style={{ padding: '1.5rem', border: '1px solid var(--tps-border)', marginBottom: 0 }}>
                          <h4 style={{ margin: '0 0 0.5rem 0' }}><i className="fas fa-file-pdf" style={{ color: '#ef4444' }}></i> Plan de Trabajo</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--tps-text-muted)', margin: '0 0 1rem 0' }}>Formato con las actividades firmadas por estudiante, tutor y supervisor de empresa.</p>
                          <a
                            href={`http://localhost:8000/api/pasantias/${detalle.id}/pdf/plan`}
                            target="_blank"
                            rel="noreferrer"
                            className="tps-btn tps-btn-outline"
                            style={{ width: '100%', justifyContent: 'center' }}
                          >
                            Abrir Documento
                          </a>
                        </div>

                        <div className="tps-card" style={{ padding: '1.5rem', border: '1px solid var(--tps-border)', marginBottom: 0 }}>
                          <h4 style={{ margin: '0 0 0.5rem 0' }}><i className="fas fa-file-excel" style={{ color: '#10b981' }}></i> Seguimiento Asistencias</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--tps-text-muted)', margin: '0 0 1rem 0' }}>Planilla completa de bitácoras y horas aprobadas semanales exportada a Excel.</p>
                          <a
                            href={`http://localhost:8000/api/pasantias/${detalle.id}/excel/asistencia`}
                            className="tps-btn tps-btn-outline"
                            style={{ width: '100%', justifyContent: 'center' }}
                          >
                            Descargar Excel (.xls)
                          </a>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

        </div>

      </main>

      {/* MODAL: CALIFICAR ASISTENCIA */}
      {modalAsistencia && (
        <div className="tps-modal-backdrop">
          <div className="tps-modal">
            <div className="tps-modal-header">
              <h3>Calificar Reporte Semana {modalAsistencia.semana}</h3>
              <button className="tps-modal-close" onClick={() => setModalAsistencia(null)}>&times;</button>
            </div>
            <div className="tps-modal-body">
              <div className="tps-form-group">
                <label>Estado del Reporte Semanal:</label>
                <select
                  className="tps-select"
                  value={modalEstado}
                  onChange={(e) => setModalEstado(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="aprobado">Aprobado y Validar Horas</option>
                  <option value="corregir">Rechazar (Solicitar Corrección)</option>
                </select>
              </div>

              <div className="tps-form-group">
                <label>Comentarios / Retroalimentación:</label>
                <textarea
                  className="tps-textarea"
                  placeholder={modalEstado === 'aprobado' ? '¡Excelente trabajo! Continúa así.' : 'Indica claramente qué debe corregir el estudiante en su bitácora semanal...'}
                  value={modalComentario}
                  onChange={(e) => setModalComentario(e.target.value)}
                />
              </div>
            </div>
            <div className="tps-modal-footer">
              <button className="tps-btn tps-btn-outline" onClick={() => setModalAsistencia(null)}>Cancelar</button>
              <button
                className={`tps-btn ${modalEstado === 'aprobado' ? 'tps-btn-primary' : 'tps-btn-danger'}`}
                onClick={submitCalificarAsistencia}
                disabled={modalLoading}
              >
                {modalLoading ? <i className="fas fa-spinner fa-spin"></i> : 'Confirmar Decisión'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
