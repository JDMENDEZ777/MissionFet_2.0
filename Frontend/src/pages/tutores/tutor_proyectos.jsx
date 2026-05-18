import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './tutor_proyectos.css';

const API = 'http://localhost:8000/api';

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const estadoBadge = (estado) => {
  const map = {
    propuesto: ['tp-badge tp-badge-pending', 'Propuesto'],
    en_revision: ['tp-badge tp-badge-process', 'En Revisión'],
    aprobado: ['tp-badge tp-badge-approved', 'Aprobado'],
    finalizado: ['tp-badge tp-badge-finished', 'Finalizado'],
    rechazado: ['tp-badge tp-badge-rejected', 'Rechazado'],
  };
  const [cls, label] = map[estado] || ['tp-badge tp-badge-pending', estado];
  return <span className={cls}>{label}</span>;
};

const tlClass = (estado) => ({
  aprobado: 'completed', corregir: 'correction',
  revisado: 'in-progress', pendiente: 'pending'
}[estado] || 'pending');

const tlIcon = (estado) => ({
  aprobado: 'fas fa-check-circle', corregir: 'fas fa-exclamation-circle',
  revisado: 'fas fa-clock', pendiente: 'fas fa-clock'
}[estado] || 'fas fa-circle');

const fmt = (d) => d ? new Date(d).toLocaleDateString('es-CO') : 'Sin fecha';
const fmtDT = (d) => d ? new Date(d).toLocaleString('es-CO') : '';

export default function TutorProyectos() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [section, setSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [proyectos, setProyectos] = useState([]);
  const [stats, setStats] = useState({ total:0, finalizados:0, en_curso:0, pendientes:0 });
  const [pendientes, setPendientes] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterCiclo, setFilterCiclo] = useState('');
  // Modal calificación
  const [modalAvance, setModalAvance] = useState(null); // avance seleccionado
  const [modalNota, setModalNota] = useState('');
  const [modalComentario, setModalComentario] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  // Acta de finalización
  const [actaFile, setActaFile] = useState(null);
  const [actaLoading, setActaLoading] = useState(false);
  // Chat
  const [chatProyecto, setChatProyecto] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [chatMsg, setChatMsg] = useState('');
  const chatEndRef = useRef(null);
  const pollingRef = useRef(null);

  // Auth guard
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user'));
    if (!u || u.rol !== 'tutor') { navigate('/login'); return; }
    setUser(u);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [r1, r2] = await Promise.all([
        axios.get(`${API}/tutor/proyectos`, getHeaders()),
        axios.get(`${API}/tutor/proyectos/pendientes`, getHeaders()),
      ]);
      if (r1.data.success) {
        setProyectos(r1.data.proyectos);
        setStats(r1.data.stats);
      }
      if (r2.data.success) setPendientes(r2.data.pendientes);
    } catch (e) {
      setError('Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  // Chat polling
  const startPolling = useCallback((proyectoId) => {
    stopPolling();
    pollingRef.current = setInterval(() => loadMensajes(proyectoId), 5000);
  }, []);

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  };

  useEffect(() => () => stopPolling(), []);

  const loadMensajes = async (id) => {
    try {
      const r = await axios.get(`${API}/tutor/proyectos/${id}/mensajes`, getHeaders());
      if (r.data.success) {
        setMensajes(r.data.mensajes);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch {}
  };

  const openChat = (p) => {
    setChatProyecto(p);
    setMensajes([]);
    loadMensajes(p.id);
    startPolling(p.id);
    setSection('chat');
  };

  const sendMensaje = async (e) => {
    e.preventDefault();
    if (!chatMsg.trim() || !chatProyecto) return;
    try {
      await axios.post(`${API}/tutor/proyectos/${chatProyecto.id}/mensajes`,
        { receptor_id: chatProyecto.estudiante_id, mensaje: chatMsg }, getHeaders());
      setChatMsg('');
      loadMensajes(chatProyecto.id);
    } catch { setError('Error al enviar el mensaje.'); }
  };

  const verDetalle = async (id) => {
    try {
      const r = await axios.get(`${API}/tutor/proyectos/${id}`, getHeaders());
      if (r.data.success) { setDetalle(r.data.proyecto); setSection('detalle'); }
    } catch { setError('Error al cargar el detalle.'); }
  };

  // Abrir modal de calificación
  const abrirModal = (av) => {
    setModalAvance(av);
    setModalNota(av.nota ?? '');
    setModalComentario(av.comentario_tutor ?? '');
  };
  const cerrarModal = () => setModalAvance(null);

  // Calificar desde modal
  const calificarModal = async (estado) => {
    if (!modalAvance) return;
    setModalLoading(true);
    try {
      const r = await axios.post(`${API}/tutor/proyectos/calificar`, {
        avance_id: modalAvance.id, estado, nota: modalNota, comentario: modalComentario
      }, getHeaders());
      if (r.data.success) {
        setSuccess(`Avance ${modalAvance.numero_avance} calificado correctamente.`);
        cerrarModal();
        loadData();
        // Refrescar detalle si está abierto
        if (detalle) verDetalle(detalle.id);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Error al calificar el avance.');
    } finally { setModalLoading(false); }
  };

  // Calificar desde formulario directo (lista de pendientes)
  const calificar = async (e, avanceId) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const form = e.target;
    const fd = new FormData(form);
    const estado = 'aprobado';
    const nota = fd.get('nota');
    const comentario = fd.get('comentario');

    try {
      const r = await axios.post(`${API}/tutor/proyectos/calificar`, {
        avance_id: avanceId, estado, nota, comentario
      }, getHeaders());
      if (r.data.success) {
        setSuccess('Avance calificado correctamente.');
        loadData();
        if (detalle) verDetalle(detalle.id);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Error al calificar el avance.');
    }
  };

  // Inicializar los 4 avances de un proyecto
  const initAvances = async (proyectoId) => {
    try {
      const r = await axios.post(`${API}/tutor/proyectos/${proyectoId}/init-avances`, {}, getHeaders());
      if (r.data.success) {
        setSuccess('4 avances inicializados. El proyecto está En Revisión.');
        loadData();
        verDetalle(proyectoId);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(r.data.message || 'No se pudieron inicializar.');
      }
    } catch { setError('Error al inicializar avances.'); }
  };

  // Subir el acta de finalización de un proyecto
  const handleUploadActa = async (e) => {
    e.preventDefault();
    if (!actaFile || !detalle) return;
    setActaLoading(true);
    setError('');
    setSuccess('');

    const fd = new FormData();
    fd.append('archivo_acta', actaFile);

    try {
      const r = await axios.post(`${API}/tutor/proyectos/${detalle.id}/subir-acta`, fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (r.data.success) {
        setSuccess(r.data.message);
        setActaFile(null);
        // Recargar datos generales y los detalles del proyecto actual
        loadData();
        verDetalle(detalle.id);
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al subir el acta.');
    } finally {
      setActaLoading(false);
    }
  };

  const navTo = (s) => {
    setSection(s);
    setSidebarOpen(false);
    if (s !== 'chat') stopPolling();
    else if (chatProyecto) startPolling(chatProyecto.id);
  };

  const proyectosFiltrados = proyectos.filter(p => {
    const nom = p.estudiante_nombre?.toLowerCase() || '';
    const tit = p.titulo?.toLowerCase() || '';
    return (nom.includes(search.toLowerCase()) || tit.includes(search.toLowerCase()))
      && (!filterEstado || p.estado === filterEstado)
      && (!filterCiclo  || p.ciclo  === filterCiclo);
  });

  if (loading) return <div className="tp-loader"><i className="fas fa-spinner fa-spin"></i>&nbsp;Cargando...</div>;

  return (
    <div className={`tp-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* SIDEBAR */}
      <nav className="tp-sidebar">
        <div className="tp-sidebar-header">
          <img src="/IMG/logofet.png" alt="FET" style={{ height: 55 }} />
        </div>
        <div className="tp-user-info">
          <div className="tp-user-avatar"><i className="fas fa-user-tie"></i></div>
          <div>
            <p className="tp-user-name">{user?.name || 'Tutor'}</p>
            <p className="tp-user-role">Tutor Académico</p>
          </div>
        </div>
        <ul className="tp-nav">
          {[
            ['dashboard',  'fas fa-th-large',   'Dashboard'],
            ['pendientes', 'fas fa-tasks',        'Avances Pendientes'],
            ['chat',       'fas fa-comments',     'Chat'],
            ['estadisticas','fas fa-chart-bar',   'Estadísticas'],
          ].map(([id, icon, label]) => (
            <li key={id} className={`tp-nav-item ${section === id ? 'active' : ''}`} onClick={() => navTo(id)}>
              <i className={icon}></i><span>{label}</span>
            </li>
          ))}
        </ul>
        <div className="tp-sidebar-footer">
          <button className="tp-logout-btn" onClick={() => navigate('/tutor/dashboard')}>
            <i className="fas fa-sign-out-alt"></i> Volver al Portal
          </button>
        </div>
      </nav>

      {/* MAIN */}
      <div className="tp-main">
        <header className="tp-header">
          <button className="tp-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <i className="fas fa-bars"></i>
          </button>
          <h2>Gestión de Proyectos</h2>
        </header>

        {error && <div className="tp-alert"><i className="fas fa-exclamation-circle"></i>{error}</div>}

        {/* DASHBOARD */}
        <section className={`tp-section ${section === 'dashboard' ? 'active' : ''}`}>
          <div className="tp-section-header"><h3><i className="fas fa-th-large"></i>Dashboard</h3></div>
          <div className="tp-stats-grid">
            {[
              [stats.total,       'fas fa-users',               'Total Proyectos', ''],
              [stats.finalizados, 'fas fa-check-circle',        'Finalizados',     'success'],
              [stats.en_curso,    'fas fa-clock',               'En Curso',        'warning'],
              [stats.pendientes,  'fas fa-exclamation-triangle','Avances Pendientes','danger'],
            ].map(([val, icon, label, cls], i) => (
              <div className="tp-stat-card" key={i}>
                <div className={`tp-stat-icon ${cls}`}><i className={icon}></i></div>
                <div className="tp-stat-info"><h4>{label}</h4><p className="tp-stat-val">{val}</p></div>
              </div>
            ))}
          </div>

          <div className="tp-card">
            <div className="tp-card-header">
              <h4>Proyectos Asignados</h4>
              <div className="tp-card-actions">
                <div className="tp-search-box">
                  <i className="fas fa-search"></i>
                  <input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}>
                  <option value="">Todos los estados</option>
                  <option value="propuesto">Propuesto</option>
                  <option value="en_revision">En Revisión</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="finalizado">Finalizado</option>
                </select>
                <select value={filterCiclo} onChange={e => setFilterCiclo(e.target.value)}>
                  <option value="">Todos los ciclos</option>
                  <option value="tecnico">Técnico</option>
                  <option value="tecnologo">Tecnólogo</option>
                  <option value="profesional">Profesional</option>
                </select>
              </div>
            </div>
            <div className="tp-card-body">
              <div className="tp-table-wrap">
                <table className="tp-table">
                  <thead>
                    <tr>
                      <th>Estudiante</th><th>Código</th><th>Ciclo</th>
                      <th>Título</th><th>Progreso</th><th>Estado</th><th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proyectosFiltrados.length === 0
                      ? <tr><td colSpan={7}><div className="tp-empty"><i className="fas fa-folder-open"></i><p>Sin proyectos</p></div></td></tr>
                      : proyectosFiltrados.map((p, index) => (
                        <tr key={`${p.id}-${index}`}>
                          <td>{p.estudiante_nombre}</td>
                          <td>{p.codigo_estudiante}</td>
                          <td style={{ textTransform: 'capitalize' }}>{p.ciclo}</td>
                          <td>{p.titulo}</td>
                          <td style={{ minWidth: 120 }}>
                            <div className="tp-progress-bar">
                              <div className="tp-progress-fill" style={{ width: `${p.progreso}%` }}></div>
                            </div>
                            <span className="tp-progress-text">{p.progreso}%</span>
                          </td>
                          <td>{estadoBadge(p.estado)}</td>
                          <td>
                            <button className="tp-btn-icon" title="Ver Detalle" onClick={() => verDetalle(p.id)}>
                              <i className="fas fa-eye"></i>
                            </button>
                            <button className="tp-btn-icon" title="Chat" onClick={() => openChat(p)}>
                              <i className="fas fa-comments"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* DETALLE */}
        <section className={`tp-section ${section === 'detalle' ? 'active' : ''}`}>
          <div className="tp-section-header">
            <h3><i className="fas fa-info-circle"></i>Detalle de Proyecto</h3>
          </div>
          {!detalle
            ? <div className="tp-empty"><i className="fas fa-info-circle"></i><p>Selecciona un proyecto.</p></div>
            : <div className="tp-card" style={{ margin: '0 1.5rem 1.5rem' }}>
                <div className="tp-card-header">
                  <h4>{detalle.titulo}</h4>
                  <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
                    {estadoBadge(detalle.estado)}
                    {(!detalle.avances || detalle.avances.length === 0) && (
                      <button className="tp-btn tp-btn-primary" onClick={() => initAvances(detalle.id)}>
                        <i className="fas fa-play-circle"></i> Inicializar 4 Avances
                      </button>
                    )}
                    <button className="tp-btn" style={{background:'#64748b',color:'white'}} onClick={() => navTo('dashboard')}>
                      <i className="fas fa-arrow-left"></i> Volver
                    </button>
                  </div>
                </div>
                <div className="tp-card-body">
                  <div className="tp-info-grid">
                    <div className="tp-info-group">
                      <h5>Estudiante</h5>
                      <p><strong>Nombre:</strong> {detalle.estudiante_nombre}</p>
                      <p><strong>Código:</strong> {detalle.codigo_estudiante}</p>
                      <p><strong>Email:</strong> {detalle.estudiante_email}</p>
                      <p><strong>Ciclo:</strong> {detalle.ciclo}</p>
                    </div>
                    <div className="tp-info-group">
                      <h5>Proyecto</h5>
                      <p><strong>Tipo:</strong> {detalle.tipo || 'proyecto'}</p>
                      <p><strong>Descripción:</strong> {detalle.descripcion || '—'}</p>
                      <p><strong>Creado:</strong> {fmt(detalle.created_at)}</p>
                    </div>
                    <div className="tp-info-group">
                      <h5>Progreso</h5>
                      <p><strong>Avances aprobados:</strong> {detalle.avances?.filter(a=>a.estado==='aprobado').length || 0} / 4</p>
                      <div className="tp-progress-bar" style={{marginTop:'0.5rem'}}>
                        <div className="tp-progress-fill" style={{width:`${((detalle.avances?.filter(a=>a.estado==='aprobado').length||0)/4)*100}%`}}></div>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN DEL ACTA DE FINALIZACIÓN */}
                  {detalle.estado === 'finalizado' ? (
                    <div style={{
                      marginTop: '1.5rem',
                      padding: '1.25rem',
                      background: 'rgba(3,151,8,.06)',
                      border: '1px solid rgba(3,151,8,.2)',
                      borderRadius: '0.5rem'
                    }}>
                      <h5 style={{ color: '#039708', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontWeight: 700 }}>
                        <i className="fas fa-check-circle"></i> ¡Proyecto Finalizado!
                      </h5>
                      <p style={{ margin: '0.5rem 0 1rem', fontSize: '0.9rem', color: '#334155' }}>
                        Este proyecto ha concluido exitosamente y se ha cargado el Acta de Finalización correspondiente.
                      </p>
                      {detalle.archivo_acta && (
                        <a className="tp-btn tp-btn-success" href={`http://localhost:8000/uploads/proyectos/actas/${detalle.archivo_acta}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                          <i className="fas fa-file-download"></i> Descargar Acta de Finalización
                        </a>
                      )}
                    </div>
                  ) : (detalle.avances?.filter(a => a.estado === 'aprobado').length === 4) ? (
                    <div style={{
                      marginTop: '1.5rem',
                      padding: '1.25rem',
                      background: 'rgba(2,132,199,.06)',
                      border: '1px solid rgba(2,132,199,.2)',
                      borderRadius: '0.5rem'
                    }}>
                      <h5 style={{ color: 'var(--tp-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontWeight: 700 }}>
                        <i className="fas fa-file-signature"></i> Finalizar Proceso y Cargar Acta
                      </h5>
                      <p style={{ margin: '0.5rem 0 1rem', fontSize: '0.9rem', color: '#334155' }}>
                        Todos los avances han sido aprobados con éxito. Sube el Acta de Finalización en formato PDF o Imagen para finalizar formalmente este proyecto.
                      </p>
                      <form onSubmit={handleUploadActa} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          required
                          style={{ fontSize: '0.85rem' }}
                          onChange={e => setActaFile(e.target.files[0])}
                        />
                        <button
                          type="submit"
                          disabled={actaLoading}
                          className="tp-btn tp-btn-primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}
                        >
                          {actaLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-upload"></i>}
                          Subir Acta y Finalizar
                        </button>
                      </form>
                    </div>
                  ) : null}

                  {/* Timeline avances con botón calificar */}
                  <div style={{ marginTop: '1.5rem' }}>
                    <h5 style={{ color: 'var(--tp-primary)', marginBottom: '1rem' }}>Avances del Proyecto</h5>
                    {!detalle.avances?.length
                      ? <div className="tp-empty" style={{padding:'2rem'}}>
                          <i className="fas fa-layer-group"></i>
                          <p>Sin avances. Haz clic en <strong>"Inicializar 4 Avances"</strong> para comenzar.</p>
                        </div>
                      : <div className="tp-timeline">
                          {detalle.avances.map(av => (
                            <div className="tp-tl-item" key={av.id}>
                              <div className={`tp-tl-marker ${tlClass(av.estado)}`}>
                                <i className={tlIcon(av.estado)}></i>
                              </div>
                              <div className="tp-tl-content">
                                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'0.5rem'}}>
                                  <h6>Avance {av.numero_avance}</h6>
                                  {av.estado !== 'aprobado' && (
                                    <button className="tp-btn tp-btn-primary" style={{padding:'0.3rem 0.7rem',fontSize:'0.8rem'}}
                                      onClick={() => abrirModal(av)}>
                                      <i className="fas fa-pen"></i> Calificar
                                    </button>
                                  )}
                                </div>
                                <p className="tp-tl-date">{av.fecha_entrega ? fmtDT(av.fecha_entrega) : 'Esperando entrega del estudiante'}</p>
                                {estadoBadge(av.estado)}
                                {av.nota != null && <p style={{marginTop:'0.3rem'}}>Nota: <strong>{av.nota}</strong></p>}
                                {av.comentario_estudiante && <p style={{marginTop:'0.3rem',fontSize:'0.85rem',background:'rgba(100,116,139,.07)',padding:'0.4rem',borderRadius:'0.25rem'}}><strong>Estudiante:</strong> {av.comentario_estudiante}</p>}
                                {av.comentario_tutor && <p style={{marginTop:'0.3rem',fontSize:'0.85rem',background:'rgba(3,151,8,.07)',padding:'0.4rem',borderRadius:'0.25rem'}}><strong>Tu comentario:</strong> {av.comentario_tutor}</p>}
                                {av.archivo_entregado && (
                                  <a className="tp-download-btn" style={{marginTop:'0.4rem'}} href={`http://localhost:8000/uploads/proyectos/entregas/${av.archivo_entregado}`} target="_blank" rel="noreferrer">
                                    <i className="fas fa-file-download"></i> Ver entrega
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                    }
                  </div>
                </div>
              </div>
          }
        </section>

        {/* AVANCES PENDIENTES */}
        <section className={`tp-section ${section === 'pendientes' ? 'active' : ''}`}>
          <div className="tp-section-header"><h3><i className="fas fa-tasks"></i>Avances Pendientes</h3></div>
          <div style={{ padding: '0 1.5rem 1.5rem' }}>
            {pendientes.length === 0
              ? <div className="tp-empty"><i className="fas fa-check-circle"></i><p>Sin avances pendientes.</p></div>
              : <div className="tp-avances-grid">
                  {pendientes.map((av, index) => (
                    <div className="tp-avance-card" key={`${av.id}-${index}`}>
                      <div className="tp-avance-head">
                        <h5>{av.estudiante_nombre}</h5>
                        <span className="tp-avance-num">Avance {av.numero_avance}</span>
                      </div>
                      <div className="tp-avance-body">
                        <p className="tp-avance-title">{av.proyecto_titulo}</p>
                        <p className="tp-avance-date">Entregado: {fmtDT(av.fecha_entrega)}</p>
                        {av.comentario_estudiante && (
                          <div className="tp-comentario-est">
                            <strong>Comentario estudiante:</strong>
                            <p>{av.comentario_estudiante}</p>
                          </div>
                        )}
                        {av.archivo_entregado && (
                          <a className="tp-download-btn" href={`http://localhost:8000/uploads/proyectos/entregas/${av.archivo_entregado}`} target="_blank" rel="noreferrer">
                            <i className="fas fa-file-download"></i> Ver entrega
                          </a>
                        )}
                        <form className="tp-form-calif" onSubmit={(e) => calificar(e, av.id)}>
                          <div className="tp-form-group">
                            <label>Comentario</label>
                            <textarea name="comentario" rows={3} defaultValue={av.comentario_tutor || ''} required />
                          </div>
                          <div className="tp-form-group">
                            <label>Nota (0-5)</label>
                            <input type="number" name="nota" min="0" max="5" step="0.1" defaultValue={av.nota || ''} required />
                          </div>
                          <div className="tp-form-actions">
                            <button type="submit" name="estado" value="aprobado" className="tp-btn tp-btn-success"
                              onClick={e => { e.currentTarget.form.elements['estado'] || (e.currentTarget.form.dataset.estado = 'aprobado'); }}>
                              <i className="fas fa-check"></i> Aprobar
                            </button>
                            <button type="button" className="tp-btn tp-btn-warning"
                              onClick={async (e) => {
                                const form = e.target.closest('form');
                                const fd = new FormData(form);
                                try {
                                  await axios.post(`${API}/tutor/proyectos/calificar`,
                                    { avance_id: av.id, estado: 'corregir', nota: fd.get('nota'), comentario: fd.get('comentario') },
                                    getHeaders());
                                  loadData();
                                } catch (e) {
                                  setError(e.response?.data?.message || 'Error al calificar.');
                                }
                              }}>
                              <i className="fas fa-redo"></i> Solicitar Corrección
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </section>

        {/* CHAT */}
        <section className={`tp-section ${section === 'chat' ? 'active' : ''}`}>
          <div className="tp-section-header"><h3><i className="fas fa-comments"></i>Chat con Estudiantes</h3></div>
          <div className="tp-chat-container">
            <div className="tp-chat-list">
              {proyectos.map(p => (
                <div key={p.id}
                  className={`tp-chat-item ${chatProyecto?.id === p.id ? 'active' : ''}`}
                  onClick={() => openChat(p)}>
                  <div className="tp-chat-avatar"><i className="fas fa-user-graduate"></i></div>
                  <div className="tp-chat-item-info">
                    <h4>{p.estudiante_nombre}</h4>
                    <p>{p.titulo}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="tp-chat-content">
              {!chatProyecto
                ? <div className="tp-chat-placeholder"><i className="fas fa-comments"></i><p>Selecciona un estudiante para chatear.</p></div>
                : <div className="tp-chat-active">
                    <div className="tp-chat-head">
                      <i className="fas fa-user-graduate"></i>
                      <strong>{chatProyecto.estudiante_nombre}</strong>
                      <span style={{ marginLeft: '0.5rem', color: 'var(--tp-text-light)', fontSize: '0.85rem' }}>— {chatProyecto.titulo}</span>
                    </div>
                    <div className="tp-chat-messages">
                      {mensajes.map(m => {
                        const sent = String(m.emisor_id) === String(user?.id);
                        return (
                          <div key={m.id} className={`tp-msg ${sent ? 'tp-msg-sent' : 'tp-msg-recv'}`}>
                            <div className="tp-msg-body">
                              {m.mensaje && <div>{m.mensaje}</div>}
                              <div className="tp-msg-time">{fmtDT(m.fecha_envio)}</div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef}></div>
                    </div>
                    <div className="tp-chat-input-area">
                      <form className="tp-chat-form" onSubmit={sendMensaje}>
                        <textarea
                          placeholder="Escribe un mensaje..."
                          value={chatMsg}
                          onChange={e => setChatMsg(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMensaje(e); } }}
                        />
                        <button type="submit" className="tp-chat-send"><i className="fas fa-paper-plane"></i></button>
                      </form>
                    </div>
                  </div>
              }
            </div>
          </div>
        </section>

        {/* ESTADÍSTICAS */}
        <section className={`tp-section ${section === 'estadisticas' ? 'active' : ''}`}>
          <div className="tp-section-header"><h3><i className="fas fa-chart-bar"></i>Estadísticas</h3></div>
          <div className="tp-stats-container">
            <div className="tp-card">
              <div className="tp-card-header"><h4>Resumen de Actividad</h4></div>
              <div className="tp-card-body">
                <div className="tp-stats-summary">
                  {[
                    [stats.pendientes,  'Avances Pendientes',''],
                    [stats.finalizados, 'Proyectos Finalizados','success'],
                    [stats.en_curso,    'En Proceso','warning'],
                    [stats.total,       'Total Proyectos',''],
                  ].map(([val, lbl, cls], i) => (
                    <div key={i}>
                      <div className={`tp-stat-circle ${cls}`}>
                        <span className="tp-stat-num">{val}</span>
                        <span className="tp-stat-lbl">{lbl}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* BANNER ÉXITO */}
      {success && (
        <div style={{
          position:'fixed', bottom:'1.5rem', right:'1.5rem',
          background:'#039708', color:'white',
          padding:'1rem 1.5rem', borderRadius:'0.5rem',
          boxShadow:'0 4px 12px rgba(0,0,0,.2)',
          zIndex:9999, display:'flex', alignItems:'center', gap:'0.75rem',
          animation:'tpFadeIn 0.3s ease'
        }}>
          <i className="fas fa-check-circle"></i> {success}
        </div>
      )}

      {/* MODAL CALIFICACIÓN */}
      {modalAvance && (
        <div style={{
          position:'fixed', inset:0,
          background:'rgba(0,0,0,0.5)',
          zIndex:10000, display:'flex',
          alignItems:'center', justifyContent:'center',
          padding:'1rem'
        }}>
          <div style={{
            background:'white', borderRadius:'0.75rem',
            padding:'2rem', width:'100%', maxWidth:'480px',
            boxShadow:'0 20px 60px rgba(0,0,0,.3)'
          }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
              <h3 style={{color:'var(--tp-primary)', margin:0}}>
                <i className="fas fa-pen" style={{marginRight:'0.5rem'}}></i>
                Calificar Avance {modalAvance.numero_avance}
              </h3>
              <button onClick={cerrarModal} style={{background:'none',border:'none',fontSize:'1.3rem',cursor:'pointer',color:'#64748b'}}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {modalAvance.comentario_estudiante && (
              <div style={{background:'rgba(100,116,139,.07)', padding:'0.75rem', borderRadius:'0.375rem', marginBottom:'1rem', fontSize:'0.9rem'}}>
                <strong>Comentario del estudiante:</strong>
                <p style={{margin:'0.4rem 0 0', color:'#475569'}}>{modalAvance.comentario_estudiante}</p>
              </div>
            )}

            {modalAvance.archivo_entregado && (
              <a href={`/uploads/proyectos/entregas/${modalAvance.archivo_entregado}`}
                target="_blank" rel="noreferrer"
                style={{display:'inline-flex', alignItems:'center', gap:'0.4rem', color:'var(--tp-primary)', marginBottom:'1rem', fontSize:'0.9rem', textDecoration:'none'}}>
                <i className="fas fa-file-pdf"></i> Ver archivo entregado
              </a>
            )}

            <div style={{marginBottom:'1rem'}}>
              <label style={{display:'block', fontWeight:600, marginBottom:'0.35rem', fontSize:'0.9rem'}}>
                Comentario / Retroalimentación
              </label>
              <textarea
                rows={4}
                value={modalComentario}
                onChange={e => setModalComentario(e.target.value)}
                placeholder="Escribe tu retroalimentación para el estudiante..."
                style={{width:'100%', padding:'0.5rem', border:'1px solid #e2e8f0', borderRadius:'0.375rem', fontFamily:'inherit', fontSize:'0.9rem', boxSizing:'border-box', resize:'vertical'}}
              />
            </div>

            <div style={{marginBottom:'1.5rem'}}>
              <label style={{display:'block', fontWeight:600, marginBottom:'0.35rem', fontSize:'0.9rem'}}>
                Nota (0.0 – 5.0)
              </label>
              <input
                type="number" min="0" max="5" step="0.1"
                value={modalNota}
                onChange={e => setModalNota(e.target.value)}
                placeholder="Ej: 4.2"
                style={{width:'100%', padding:'0.5rem', border:'1px solid #e2e8f0', borderRadius:'0.375rem', fontSize:'0.9rem', boxSizing:'border-box'}}
              />
            </div>

            <div style={{display:'flex', gap:'0.75rem', flexWrap:'wrap'}}>
              <button
                className="tp-btn tp-btn-success"
                disabled={modalLoading || !modalNota}
                onClick={() => calificarModal('aprobado')}
                style={{flex:1}}
              >
                <i className="fas fa-check"></i> Aprobar
              </button>
              <button
                className="tp-btn tp-btn-warning"
                disabled={modalLoading}
                onClick={() => calificarModal('corregir')}
                style={{flex:1}}
              >
                <i className="fas fa-redo"></i> Solicitar Corrección
              </button>
              <button
                className="tp-btn"
                style={{background:'#e2e8f0', color:'#475569'}}
                onClick={cerrarModal}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
