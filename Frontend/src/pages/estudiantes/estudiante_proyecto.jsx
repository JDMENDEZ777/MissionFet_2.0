import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './estudiante_proyecto.css';

const API = 'http://localhost:8000/api';
const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      ...(isMultipart ? { 'Content-Type': 'multipart/form-data' } : {})
    }
  };
};

export default function EstudianteProyecto() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [section, setSection] = useState('resumen');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [proyecto, setProyecto] = useState(null);
  const [avances, setAvances] = useState([]);
  const [notificaciones, setNotificaciones] = useState(0);
  
  const [toastNotif, setToastNotif] = useState(null);
  const knownAvancesRef = useRef(0);
  const knownMensajesRef = useRef(0);
  const isFirstPoll = useRef(true);

  // Chat
  const [mensajes, setMensajes] = useState([]);
  const [chatMsg, setChatMsg] = useState('');
  const [chatFile, setChatFile] = useState(null);
  const chatEndRef = useRef(null);
  const pollingRef = useRef(null);

  // Subir avance
  const [avanceFiles, setAvanceFiles] = useState([]);
  const [avanceComment, setAvanceComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user'));
    // En este sistema, puede que el rol sea 'estudiante' o null. Pero validamos que exista.
    if (!u || !u.id) {
      navigate('/login');
      return;
    }
    setUser(u);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const r = await axios.get(`${API}/estudiante/proyecto`, getHeaders());
      if (r.data.success) {
        setProyecto(r.data.proyecto);
        setAvances(r.data.avances || []);
        setNotificaciones(r.data.notificaciones || 0);
      } else {
        setError(r.data.message);
      }
    } catch (e) {
      setError('Error al cargar la información del proyecto.');
    } finally {
      setLoading(false);
    }
  };

  // --- GLOBAL POLLING (NOTIFICACIONES Y CHAT) ---
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!user || !user.id) return;
      try {
        const r1 = await axios.get(`${API}/estudiante/proyecto`, getHeaders());
        if (r1.data.success) {
          setProyecto(r1.data.proyecto);
          const avs = r1.data.avances || [];
          setAvances(avs);
          setNotificaciones(r1.data.notificaciones || 0);

          let tutorRespCount = 0;
          avs.forEach(a => { if (a.comentario_tutor) tutorRespCount++; });
          
          if (!isFirstPoll.current && tutorRespCount > knownAvancesRef.current) {
            setToastNotif('El tutor ha respondido a tu avance de proyecto.');
            setTimeout(() => setToastNotif(null), 5000);
          }
          knownAvancesRef.current = tutorRespCount;
        }

        const r2 = await axios.get(`${API}/estudiante/proyecto/mensajes`, getHeaders());
        if (r2.data.success) {
          const msgs = r2.data.mensajes || [];
          setMensajes(msgs);

          let tutorMsgsCount = 0;
          msgs.forEach(m => {
            if (m.emisor_id !== user.id) tutorMsgsCount++;
          });

          if (!isFirstPoll.current && tutorMsgsCount > knownMensajesRef.current) {
            setToastNotif('Tienes un nuevo mensaje del tutor en el chat.');
            setTimeout(() => setToastNotif(null), 5000);
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          }
          knownMensajesRef.current = tutorMsgsCount;
        }

        isFirstPoll.current = false;
      } catch (e) {}
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const loadMensajes = async () => {
    try {
      const r = await axios.get(`${API}/estudiante/proyecto/mensajes`, getHeaders());
      if (r.data.success) {
        setMensajes(r.data.mensajes);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (e) {
      // silencioso
    }
  };

  const navTo = (s) => {
    setSection(s);
    setSidebarOpen(false);
    if (s === 'chat') {
      loadMensajes();
    }
  };

  const handleSendMensaje = async (e) => {
    e.preventDefault();
    if (!chatMsg.trim() && !chatFile) return;

    const fd = new FormData();
    fd.append('mensaje', chatMsg);
    if (chatFile) fd.append('archivo', chatFile);

    try {
      await axios.post(`${API}/estudiante/proyecto/mensajes`, fd, getHeaders(true));
      setChatMsg('');
      setChatFile(null);
      loadMensajes();
    } catch (e) {
      setError('Error al enviar el mensaje.');
    }
  };

  const handleSubirAvance = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!avanceFiles || avanceFiles.length === 0) {
      setError('Debes adjuntar al menos un archivo.');
      return;
    }

    setIsSubmitting(true);
    const fd = new FormData();
    fd.append('numero_avance', proximoAvanceNum);
    
    Array.from(avanceFiles).forEach(file => {
      fd.append('archivos_avance[]', file);
    });

    fd.append('comentario_estudiante', avanceComment);

    try {
      const r = await axios.post(`${API}/estudiante/proyecto/avances`, fd, getHeaders(true));
      if (r.data.success) {
        setSuccess('Avance entregado correctamente.');
        setAvanceFiles([]);
        setAvanceComment('');
        document.getElementById('fileAvance').value = ''; // clear input
        loadData();
        navTo('historial');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(r.data.message);
      }
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'Error al enviar el avance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{padding:'2rem', textAlign:'center', color:'#039708'}}><i className="fas fa-spinner fa-spin fa-2x"></i></div>;

  const totalAvances = 4;
  const avancesEntregadosMap = {};
  let avancesAprobados = 0;
  let avanceParaCorregir = null;
  let primerAvanceSinEntregar = null;
  let maxAvanceEntregado = 0;

  avances.forEach(av => {
    avancesEntregadosMap[av.numero_avance] = av;
    if (av.estado === 'aprobado') avancesAprobados++;
    if (av.estado === 'corregir') avanceParaCorregir = av.numero_avance;
    
    // Si la ranura existe pero no tiene archivo, es un avance pendiente de subir
    if (!av.archivo_entregado && primerAvanceSinEntregar === null) {
      primerAvanceSinEntregar = av.numero_avance;
    }

    if (av.numero_avance > maxAvanceEntregado && av.archivo_entregado) {
        maxAvanceEntregado = av.numero_avance;
    }
  });

  const porcentajeProgreso = (avancesAprobados / totalAvances) * 100;
  
  // Prioridad: 
  // 1. Corregir uno devuelto
  // 2. Subir el primero sin entregar (si el tutor inicializó las 4 ranuras)
  // 3. Subir el siguiente avance (si las ranuras se van creando 1 a 1)
  let proximoAvanceNum = null;
  if (avanceParaCorregir) {
      proximoAvanceNum = avanceParaCorregir;
  } else if (primerAvanceSinEntregar) {
      proximoAvanceNum = primerAvanceSinEntregar;
  } else if (maxAvanceEntregado < totalAvances) {
      proximoAvanceNum = maxAvanceEntregado + 1;
  }

  const canSubmit = proximoAvanceNum !== null;

  // Nota final
  let sumaNotas = 0;
  let todasCalificadas = true;
  if (avances.length === totalAvances) {
    avances.forEach(a => {
      if (a.nota === null) todasCalificadas = false;
      else sumaNotas += parseFloat(a.nota);
    });
  } else {
    todasCalificadas = false;
  }
  const notaFinal = todasCalificadas ? (sumaNotas / totalAvances).toFixed(1) : 0;
  const puedeVerNotaFinal = todasCalificadas || proyecto.estado === 'finalizado';

  // Render Helpers
  const fmtDT = (d) => new Date(d).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  const fmtD = (d) => new Date(d).toLocaleDateString('es-ES');

  const estadoBadge = (est) => {
    const map = {
      propuesto:   { c: 'ep-alert-error', t: 'Propuesto' },
      en_revision: { c: 'ep-alert-success', t: 'En Revisión' },
      aprobado:    { c: 'ep-alert-success', t: 'Aprobado' },
      finalizado:  { c: 'ep-alert-success', t: 'Finalizado' },
      pendiente:   { c: 'ep-alert-error', t: 'Pendiente' },
      corregir:    { c: 'ep-alert-error', t: 'Requiere Corrección', bg: '#fef08a', color:'#854d0e' },
    };
    const e = map[est] || { c: 'ep-alert-error', t: est };
    return <span className="ep-estado" style={{ background: e.bg || '', color: e.color || '' }}>{e.t}</span>;
  };

  const getStepIcon = (num) => {
    const av = avancesEntregadosMap[num];
    if (!av) return { cls: 'pending', icon: 'fas fa-circle' };
    if (av.estado === 'aprobado') return { cls: 'completed', icon: 'fas fa-check-circle' };
    if (av.estado === 'corregir') return { cls: 'correction', icon: 'fas fa-exclamation-circle' };
    return { cls: 'in-progress', icon: 'fas fa-clock' }; // pendiente / revisado
  };

  return (
    <div className={`ep-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* SIDEBAR */}
      <nav className="ep-sidebar">
        <div className="ep-sidebar-header">
          <img src="/IMG/logofet.png" alt="FET Logo" style={{ width: '100px' }} />
        </div>
        <div className="ep-user-info">
          <div className="ep-user-avatar"><i className="fas fa-user-graduate"></i></div>
          <div>
            <p className="ep-user-name">{user?.name}</p>
            <p className="ep-user-role">Estudiante</p>
          </div>
        </div>
        <ul className="ep-nav">
          <li className={`ep-nav-item ${section==='resumen'?'active':''}`} onClick={()=>navTo('resumen')}><i className="fas fa-file-alt"></i> Resumen</li>
          <li className={`ep-nav-item ${section==='progreso'?'active':''}`} onClick={()=>navTo('progreso')}><i className="fas fa-chart-line"></i> Progreso</li>
          <li className={`ep-nav-item ${section==='subir'?'active':''}`} onClick={()=>navTo('subir')}><i className="fas fa-upload"></i> Subir Avance</li>
          <li className={`ep-nav-item ${section==='historial'?'active':''}`} onClick={()=>navTo('historial')}>
            <i className="fas fa-history"></i> Historial
            {notificaciones > 0 && <span className="ep-badge">{notificaciones}</span>}
          </li>
          <li className={`ep-nav-item ${section==='chat'?'active':''}`} onClick={()=>navTo('chat')}><i className="fas fa-comments"></i> Chat con Tutor</li>
          {puedeVerNotaFinal && <li className={`ep-nav-item ${section==='nota'?'active':''}`} onClick={()=>navTo('nota')}><i className="fas fa-award"></i> Nota Final</li>}
        </ul>
        <div className="ep-sidebar-footer">
          <button className="ep-logout-btn" onClick={() => { localStorage.clear(); navigate('/login'); }}>
            <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* MAIN */}
      <div className="ep-main">
        {toastNotif && (
          <div style={{
            position: 'fixed', top: '20px', right: '20px', background: '#0f766e', color: 'white',
            padding: '1rem 1.5rem', borderRadius: '8px', zIndex: 9999, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600
          }}>
            <i className="fas fa-bell fa-shake"></i>
            <span>{toastNotif}</span>
          </div>
        )}
        <header className="ep-header">
          <div style={{display:'flex', alignItems:'center'}}>
            <button className="ep-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}><i className="fas fa-bars"></i></button>
            <h2>Gestión de Proyectos</h2>
          </div>
          <div className="ep-notification-icon" onClick={()=>navTo('historial')}>
            <i className="fas fa-bell"></i>
            {notificaciones > 0 && <span style={{position:'absolute',top:-5,right:-5,background:'red',color:'white',borderRadius:'50%',width:16,height:16,fontSize:10,display:'flex',alignItems:'center',justifyContent:'center'}}>{notificaciones}</span>}
          </div>
        </header>

        {error && <div className="ep-alert ep-alert-error"><i className="fas fa-exclamation-circle"></i> {error}</div>}
        {success && <div className="ep-alert ep-alert-success"><i className="fas fa-check-circle"></i> {success}</div>}

        {!proyecto ? (
          <div className="ep-empty"><i className="fas fa-folder-open"></i><p>No tienes un proyecto registrado o asignado como líder.</p></div>
        ) : (
          <>
            {/* RESUMEN */}
            <section className={`ep-section ${section === 'resumen' ? 'active' : ''}`}>
              <div className="ep-section-header"><h3><i className="fas fa-file-alt"></i> Resumen del Proyecto</h3></div>
              <div className="ep-card">
                <div className="ep-card-header"><h4>{proyecto.titulo}</h4></div>
                <div className="ep-card-body">
                  <div className="ep-info-grid">
                    <div className="ep-info-item"><span className="ep-info-label">Tipo</span><span className="ep-info-value" style={{textTransform:'capitalize'}}>{proyecto.tipo || 'Proyecto'}</span></div>
                    <div className="ep-info-item"><span className="ep-info-label">Empresa</span><span className="ep-info-value">{proyecto.nombre_empresa || 'No aplica'}</span></div>
                    <div className="ep-info-item"><span className="ep-info-label">Tutor Asignado</span><span className="ep-info-value">{proyecto.tutor_nombre || 'No asignado'}</span></div>
                    <div className="ep-info-item"><span className="ep-info-label">Fecha Creación</span><span className="ep-info-value">{fmtD(proyecto.created_at)}</span></div>
                    <div className="ep-info-item"><span className="ep-info-label">Estado</span>{estadoBadge(proyecto.estado)}</div>
                  </div>
                  {proyecto.archivo_proyecto && (
                    <div style={{marginTop:'1.5rem', textAlign:'center'}}>
                      <a href={`http://localhost:8000/storage/proyectos/${encodeURIComponent(proyecto.archivo_proyecto)}`} target="_blank" rel="noreferrer" className="ep-btn">
                        <i className="fas fa-file-pdf"></i> Ver Documento Inicial
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* PROGRESO */}
            <section className={`ep-section ${section === 'progreso' ? 'active' : ''}`}>
              <div className="ep-section-header"><h3><i className="fas fa-chart-line"></i> Progreso</h3></div>
              <div className="ep-card">
                <div className="ep-card-body">
                  <div className="ep-progress-container">
                    <div className="ep-progress-percentage">{Math.round(porcentajeProgreso)}%</div>
                    <div className="ep-progress-bar"><div className="ep-progress-fill" style={{width: `${porcentajeProgreso}%`}}></div></div>
                    <div className="ep-progress-steps">
                      {[1,2,3,4].map(num => {
                        const s = getStepIcon(num);
                        return (
                          <div key={num} className={`ep-step ${s.cls}`}>
                            <div className="ep-step-icon"><i className={s.icon}></i></div>
                            <span className="ep-step-label">Avance {num}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="ep-legend">
                    <div className="ep-legend-item"><i className="fas fa-circle" style={{color:'var(--ep-border)'}}></i> Pendiente</div>
                    <div className="ep-legend-item"><i className="fas fa-clock" style={{color:'var(--ep-primary-light)'}}></i> En revisión</div>
                    <div className="ep-legend-item"><i className="fas fa-exclamation-circle" style={{color:'var(--ep-warning)'}}></i> Requiere corrección</div>
                    <div className="ep-legend-item"><i className="fas fa-check-circle" style={{color:'var(--ep-success)'}}></i> Aprobado</div>
                  </div>
                </div>
              </div>
            </section>

            {/* SUBIR AVANCE */}
            <section className={`ep-section ${section === 'subir' ? 'active' : ''}`}>
              <div className="ep-section-header"><h3><i className="fas fa-upload"></i> Subir Avance</h3></div>
              <div className="ep-card">
                <div className="ep-card-body">
                  <form onSubmit={handleSubirAvance}>
                    <div className="ep-form-group">
                      <label>Número de Avance</label>
                      <select disabled value={proximoAvanceNum}>
                        {canSubmit ? (
                          <option value={proximoAvanceNum}>
                            Avance {proximoAvanceNum} {avanceParaCorregir ? '(Corrección)' : ''}
                          </option>
                        ) : (
                          <option>Todos los avances entregados</option>
                        )}
                      </select>
                    </div>
                    <div className="ep-form-group">
                      <label>Archivos (PDF, Imágenes, Word, máx 5MB c/u)</label>
                      <input type="file" id="fileAvance" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={e => setAvanceFiles(e.target.files)} disabled={!canSubmit} />
                      {avanceFiles.length > 0 && <small style={{display:'block',marginTop:'0.5rem',color:'var(--ep-primary)'}}>{avanceFiles.length} archivo(s) seleccionado(s)</small>}
                    </div>
                    <div className="ep-form-group">
                      <label>Comentario Estudiante (opcional)</label>
                      <textarea rows={3} value={avanceComment} onChange={e=>setAvanceComment(e.target.value)} disabled={!canSubmit}></textarea>
                    </div>
                    <div style={{textAlign:'center', marginTop:'1.5rem'}}>
                      <button type="submit" className="ep-btn" disabled={!canSubmit || isSubmitting}>
                        <i className="fas fa-paper-plane"></i> {isSubmitting ? 'Enviando...' : 'Enviar Avance'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </section>

            {/* HISTORIAL */}
            <section className={`ep-section ${section === 'historial' ? 'active' : ''}`}>
              <div className="ep-section-header"><h3><i className="fas fa-history"></i> Historial de Entregas</h3></div>
              <div className="ep-card">
                <div className="ep-card-body" style={{padding:0}}>
                  {avances.length === 0 ? (
                    <div className="ep-empty"><i className="fas fa-folder-open"></i><p>Aún no has realizado ninguna entrega.</p></div>
                  ) : (
                    <div style={{overflowX:'auto'}}>
                      <table className="ep-table">
                        <thead>
                          <tr><th>Avance</th><th>Archivo</th><th>Comentario Tutor</th><th>Nota</th><th>Estado</th><th>Fecha</th></tr>
                        </thead>
                        <tbody>
                          {avances.map(av => (
                            <tr key={av.id}>
                              <td>Avance {av.numero_avance}</td>
                              <td>
                                {av.archivo_entregado ? (
                                  <a href={`http://localhost:8000/uploads/proyectos/entregas/${encodeURIComponent(av.archivo_entregado)}`} target="_blank" rel="noreferrer" style={{color:'var(--ep-primary)',textDecoration:'none'}}>
                                    <i className="fas fa-file-pdf"></i> PDF
                                  </a>
                                ) : '—'}
                              </td>
                              <td style={{maxWidth:'250px'}}>
                                {av.comentario_tutor ? (
                                  <div style={{background:'rgba(3,151,8,.05)', padding:'0.5rem', borderRadius:'0.25rem', fontSize:'0.85rem'}}>
                                    {av.comentario_tutor}
                                  </div>
                                ) : <span style={{color:'var(--ep-text-light)',fontStyle:'italic'}}>Sin comentarios</span>}
                              </td>
                              <td>{av.nota || '—'}</td>
                              <td>{estadoBadge(av.estado)}</td>
                              <td style={{fontSize:'0.85rem'}}>{fmtDT(av.fecha_entrega)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* CHAT */}
            <section className={`ep-section ${section === 'chat' ? 'active' : ''}`}>
              <div className="ep-section-header"><h3><i className="fas fa-comments"></i> Chat con Tutor</h3></div>
              <div className="ep-card ep-chat-card">
                <div className="ep-chat-header">
                  <div style={{display:'flex',alignItems:'center'}}>
                    <div style={{width:36,height:36,background:'var(--ep-primary-light)',color:'white',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',marginRight:'0.5rem'}}>
                      <i className="fas fa-user-tie"></i>
                    </div>
                    <span>{proyecto.tutor_nombre || 'Sin asignar'}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.85rem',color:'var(--ep-text-light)'}}>
                    <span style={{width:10,height:10,borderRadius:'50%',background:proyecto.tutor_id ? 'var(--ep-success)' : 'gray'}}></span>
                    {proyecto.tutor_id ? 'Disponible' : 'No disponible'}
                  </div>
                </div>
                <div className="ep-chat-body">
                  {!proyecto.tutor_id ? (
                    <div className="ep-empty"><i className="fas fa-comments"></i><p>Tu tutor aún no ha sido asignado.</p></div>
                  ) : mensajes.length === 0 ? (
                    <div className="ep-empty"><i className="fas fa-comments"></i><p>No hay mensajes. Saluda a tu tutor.</p></div>
                  ) : (
                    mensajes.map(m => {
                      const isMe = m.emisor_id === user?.id;
                      return (
                        <div key={m.id} className={`ep-chat-msg ${isMe ? 'ep-chat-sent' : 'ep-chat-received'}`}>
                          <div className="ep-msg-content">
                            {m.archivo && (
                              <div style={{marginBottom:'0.5rem'}}>
                                <a href={`http://localhost:8000/uploads/proyectos/chat/${encodeURIComponent(m.archivo)}`} target="_blank" rel="noreferrer" style={{color:'inherit',textDecoration:'underline'}}>
                                  <i className="fas fa-paperclip"></i> {m.archivo}
                                </a>
                              </div>
                            )}
                            {m.mensaje && <div>{m.mensaje}</div>}
                            <div className="ep-chat-time">{fmtDT(m.fecha_envio)}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form className="ep-chat-footer" onSubmit={handleSendMensaje}>
                  <label style={{cursor:'pointer',color:'var(--ep-secondary)',fontSize:'1.2rem'}} title="Adjuntar archivo">
                    <i className="fas fa-paperclip"></i>
                    <input type="file" style={{display:'none'}} onChange={e=>setChatFile(e.target.files[0])} disabled={!proyecto.tutor_id}/>
                  </label>
                  {chatFile && <span style={{fontSize:'0.8rem',maxWidth:100,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{chatFile.name}</span>}
                  <input type="text" placeholder="Escribe un mensaje..." value={chatMsg} onChange={e=>setChatMsg(e.target.value)} disabled={!proyecto.tutor_id} />
                  <button type="submit" className="ep-chat-btn" disabled={!proyecto.tutor_id || (!chatMsg.trim() && !chatFile)}>
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </form>
              </div>
            </section>

            {/* NOTA FINAL */}
            <section className={`ep-section ${section === 'nota' ? 'active' : ''}`}>
              <div className="ep-section-header"><h3><i className="fas fa-award"></i> Nota Final y Acta</h3></div>
              <div className="ep-card">
                <div className="ep-card-body">
                  {!puedeVerNotaFinal ? (
                    <div className="ep-empty"><i className="fas fa-lock"></i><p>La nota final estará disponible cuando todos los avances hayan sido aprobados y calificados.</p></div>
                  ) : (
                    <div className="ep-nota-container">
                      <div className="ep-nota-circle">
                        <div className="ep-nota-val">{notaFinal}</div>
                        <div style={{fontSize:'0.9rem',opacity:0.9,marginTop:'0.2rem'}}>Calificación Final</div>
                      </div>
                      <div style={{flex:1, maxWidth:400}}>
                        <h4 style={{color:'var(--ep-primary)',marginBottom:'1rem'}}>Desglose de Nota</h4>
                        <table className="ep-table">
                          <thead><tr><th>Avance</th><th>Nota</th></tr></thead>
                          <tbody>
                            {avances.map(a => (
                              <tr key={a.id}><td>Avance {a.numero_avance}</td><td>{a.nota}</td></tr>
                            ))}
                            <tr style={{background:'rgba(3,151,8,.05)'}}>
                              <td><strong>Promedio</strong></td><td><strong>{notaFinal}</strong></td>
                            </tr>
                          </tbody>
                        </table>
                        {proyecto.archivo_acta ? (
                          <div style={{marginTop:'1.5rem', padding:'1rem', background:'rgba(3,151,8,.08)', border:'1px solid rgba(3,151,8,.2)', borderRadius:'0.5rem'}}>
                            <h5 style={{color:'#039708', margin:'0 0 0.5rem 0', display:'flex', alignItems:'center', gap:'0.4rem', fontWeight: 700}}>
                              <i className="fas fa-check-circle"></i> ¡Felicidades, Proceso Finalizado!
                            </h5>
                            <p style={{margin:'0 0 1rem 0', fontSize:'0.85rem', color:'#475569'}}>
                              Tu tutor ha cargado el Acta de Finalización y tu proyecto se encuentra oficialmente concluido.
                            </p>
                            <div style={{textAlign:'center'}}>
                              <a href={`http://localhost:8000/uploads/proyectos/actas/${encodeURIComponent(proyecto.archivo_acta)}`} target="_blank" rel="noreferrer" className="ep-btn" style={{background:'#039708', color:'white', display:'inline-flex', alignItems:'center', gap:'0.4rem', textDecoration:'none'}}>
                                <i className="fas fa-file-download"></i> Descargar Acta de Finalización
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div style={{marginTop:'1.5rem',padding:'1rem',background:'rgba(2,132,199,.05)',borderRadius:'0.5rem',display:'flex',gap:'0.5rem',alignItems:'center'}}>
                            <i className="fas fa-info-circle" style={{color:'var(--ep-primary)'}}></i>
                            <p style={{margin:0,fontSize:'0.9rem'}}>Tu nota final está lista. El acta oficial será subida por tu tutor próximamente para finalizar el proceso.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
