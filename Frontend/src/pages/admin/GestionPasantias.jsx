import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './GestionPasantias.css';

export default function GestionPasantias() {
  const navigate = useNavigate();
  const [navActive, setNavActive] = useState(false);
  const [activeTab, setActiveTab] = useState('crear');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [loading, setLoading] = useState(true);

  // Datos
  const [pasantias, setPasantias] = useState([]);
  const [tutores, setTutores] = useState([]);
  const [estudiantesDisponibles, setEstudiantesDisponibles] = useState([]);
  const [todosEstudiantes, setTodosEstudiantes] = useState([]);

  // Filtros
  const [searchPasantia, setSearchPasantia] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [searchEstudiante, setSearchEstudiante] = useState('');

  // Estados Formulario Crear
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const [formCrear, setFormCrear] = useState({
    titulo: '', descripcion: '', empresa: '', direccion_empresa: '', 
    contacto_empresa: '', supervisor_empresa: '', telefono_supervisor: '',
    fecha_inicio: '', fecha_fin: '', tutor_id: '', archivo_documento: null
  });

  // Modales
  const [modalVer, setModalVer] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [pasantiaActual, setPasantiaActual] = useState(null);

  // Formulario Editar
  const [formEditar, setFormEditar] = useState({
    titulo: '', descripcion: '', empresa: '', direccion_empresa: '',
    contacto_empresa: '', supervisor_empresa: '', telefono_supervisor: '',
    fecha_inicio: '', fecha_fin: '', estado: 'pendiente', tutor_id: '',
    archivo_documento: null
  });

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [rForm, rPas] = await Promise.all([
        api.get('/admin/pasantias/form-data'),
        api.get('/admin/pasantias')
      ]);
      setTutores(Array.isArray(rForm.data.tutores) ? rForm.data.tutores : []);
      setEstudiantesDisponibles(Array.isArray(rForm.data.estudiantes) ? rForm.data.estudiantes : []);
      setTodosEstudiantes(Array.isArray(rForm.data.todos_estudiantes) ? rForm.data.todos_estudiantes : rForm.data.estudiantes || []);
      setPasantias(Array.isArray(rPas.data) ? rPas.data : []);
    } catch {
      mostrarMensaje('Error al cargar datos del servidor', 'error');
    } finally { setLoading(false); }
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 5000);
  };

  const seleccionarEstudiante = (est) => {
    setEstudianteSeleccionado(est);
    setFormCrear(prev => ({ ...prev, empresa: est.nombre_empresa || '' }));
  };

  const cambiarEstudiante = () => {
    setEstudianteSeleccionado(null);
    setFormCrear({
      titulo: '', descripcion: '', empresa: '', direccion_empresa: '',
      contacto_empresa: '', supervisor_empresa: '', telefono_supervisor: '',
      fecha_inicio: '', fecha_fin: '', tutor_id: '', archivo_documento: null
    });
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!estudianteSeleccionado) return alert('Seleccione un estudiante.');
    if (formCrear.fecha_fin && formCrear.fecha_inicio && new Date(formCrear.fecha_fin) < new Date(formCrear.fecha_inicio)) {
      return alert('La fecha de fin no puede ser anterior a la de inicio.');
    }

    const fd = new FormData();
    fd.append('estudiante_id', estudianteSeleccionado.id);
    Object.keys(formCrear).forEach(key => {
      if (formCrear[key] !== null) fd.append(key, formCrear[key]);
    });

    try {
      await api.post('/admin/pasantias', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      mostrarMensaje('Pasantía creada exitosamente ✓', 'exito');
      cambiarEstudiante();
      cargarDatos();
      setActiveTab('listar');
    } catch (err) {
      mostrarMensaje(err?.response?.data?.message || 'Error al crear', 'error');
    }
  };

  const abrirVer = (p) => { setPasantiaActual(p); setModalVer(true); };

  const abrirEditar = (p) => {
    setPasantiaActual(p);
    setFormEditar({
      titulo: p.titulo || '', descripcion: p.descripcion || '', empresa: p.empresa || '',
      direccion_empresa: p.direccion_empresa || '', contacto_empresa: p.contacto_empresa || '',
      supervisor_empresa: p.supervisor_empresa || '', telefono_supervisor: p.telefono_supervisor || '',
      fecha_inicio: p.fecha_inicio || '', fecha_fin: p.fecha_fin || '',
      estado: p.estado || 'pendiente', tutor_id: p.tutor_id || '', archivo_documento: null
    });
    setModalEditar(true);
  };

  const handleEditar = async (e) => {
    e.preventDefault();
    if (formEditar.fecha_fin && formEditar.fecha_inicio && new Date(formEditar.fecha_fin) < new Date(formEditar.fecha_inicio)) {
      return alert('La fecha de fin no puede ser anterior a la de inicio.');
    }

    const fd = new FormData();
    Object.keys(formEditar).forEach(key => {
      if (formEditar[key] !== null) fd.append(key, formEditar[key]);
    });

    try {
      await api.post(`/admin/pasantias/${pasantiaActual.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      mostrarMensaje('Pasantía actualizada exitosamente ✓', 'exito');
      setModalEditar(false);
      cargarDatos();
    } catch (err) {
      mostrarMensaje(err?.response?.data?.message || 'Error al actualizar', 'error');
    }
  };

  const handleEliminar = async () => {
    try {
      await api.delete(`/admin/pasantias/${pasantiaActual.id}`);
      mostrarMensaje('Pasantía eliminada ✓', 'exito');
      setModalEliminar(false);
      setModalEditar(false);
      cargarDatos();
    } catch {
      mostrarMensaje('Error al eliminar', 'error');
    }
  };

  const estFiltradosCrear = estudiantesDisponibles.filter(e =>
    !searchEstudiante || 
    (e.nombre || '').toLowerCase().includes(searchEstudiante.toLowerCase()) ||
    (e.documento || '').includes(searchEstudiante) ||
    (e.codigo_estudiante || '').includes(searchEstudiante)
  );

  const pasantiasFiltradas = pasantias.filter(p => {
    const matchSearch = !searchPasantia || 
      (p.estudiante_nombre || '').toLowerCase().includes(searchPasantia.toLowerCase()) ||
      (p.titulo || '').toLowerCase().includes(searchPasantia.toLowerCase()) ||
      (p.empresa || '').toLowerCase().includes(searchPasantia.toLowerCase());
    const matchEstado = !filtroEstado || p.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  const formatearFecha = (fecha) => fecha ? new Date(fecha).toLocaleDateString() : 'No establecida';

  return (
    <div className="modulo-gestion-pasantias">
      {/* LOGO (botón hamburguesa) */}
      <div id="pa-logo" onClick={() => setNavActive(!navActive)}>
        <img src="/IMG/logofet.png" alt="Logo FET" className="pa-logo-img" />
      </div>

      {/* NAVBAR */}
      <nav id="pa-navbar" className={navActive ? 'active' : ''}>
        <div className="pa-nav-header">
          
          <ul>
            <li><Link to="/dashboard">Inicio</Link></li>
            <li><Link to="/aprobacion">Aprobación de Usuarios</Link></li>
            <li><Link to="/usuarios">Gestión de Usuarios</Link></li>
            <li className="pa-dropdown">
              <a href="#">Gestión de Modalidades de Grado</a>
              <ul className="pa-dropdown-content">
                <li><Link to="/seminarios">Seminario</Link></li>
                <li><Link to="/proyectos">Proyectos</Link></li>
                <li><Link to="/pasantias" className="active">Pasantías</Link></li>
              </ul>
            </li>
            <li><Link to="/reportes">Reportes y Estadísticas</Link></li>
            <li><a href="#" onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>Cerrar Sesión</a></li>
          </ul>
        </div>
      </nav>


      {/* MAIN */}
      <main className={`pa-main${navActive ? ' nav-active' : ''}`}>
        <h1 className="pa-h1">Gestión de Pasantías</h1>

        {mensaje.texto && <div className={`pa-mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>}

        {loading ? <p className="pa-loading">⏳ Cargando datos...</p> : (
          <>
            <div className="pa-tabs">
              <button className={activeTab === 'crear' ? 'active' : ''} onClick={() => setActiveTab('crear')}>Registrar Pasantía</button>
              <button className={activeTab === 'listar' ? 'active' : ''} onClick={() => setActiveTab('listar')}>Listar Pasantías</button>
            </div>

            {/* TAB CREAR */}
            {activeTab === 'crear' && (
              <div className="pa-tab-content">
                {!estudianteSeleccionado ? (
                  <div className="pa-form-group">
                    <h2 className="pa-h2">Seleccionar Estudiante</h2>
                    <input className="pa-input" style={{ marginBottom: '16px' }} type="text" placeholder="Buscar por nombre, documento o código..."
                      value={searchEstudiante} onChange={e => setSearchEstudiante(e.target.value)} />
                    <div className="pa-estudiantes-container">
                      {estFiltradosCrear.length === 0 ? <p>No hay estudiantes disponibles.</p> :
                        estFiltradosCrear.map(est => (
                          <div key={est.id} className="pa-estudiante-card" onClick={() => seleccionarEstudiante(est)}>
                            <div className="pa-estudiante-info">
                              <h3>{est.nombre} {est.ciclo && `(${est.ciclo})`}</h3>
                              <p>Código: {est.codigo_estudiante || 'N/A'} | Doc: {est.documento}</p>
                              <p>Email: {est.email}</p>
                              {est.nombre_empresa && <p style={{ color: '#039708' }}>Empresa pre-registrada: {est.nombre_empresa}</p>}
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCrear}>
                    <div className="pa-seleccionado-box">
                      <h4>Estudiante Seleccionado</h4>
                      <p><strong>Nombre:</strong> {estudianteSeleccionado.nombre} | <strong>Email:</strong> {estudianteSeleccionado.email}</p>
                      <button type="button" className="pa-btn-change" onClick={cambiarEstudiante}>Cambiar Estudiante</button>
                    </div>

                    <div className="pa-form-group">
                      <h2 className="pa-h2">Datos de la Pasantía</h2>
                      <div className="pa-form-row">
                        <div className="pa-form-field pa-full-width">
                          <label className="pa-label">Título *</label>
                          <input className="pa-input" type="text" value={formCrear.titulo}
                            onChange={e => setFormCrear({...formCrear, titulo: e.target.value})} required />
                        </div>
                      </div>
                      <div className="pa-form-row">
                        <div className="pa-form-field pa-full-width">
                          <label className="pa-label">Descripción</label>
                          <textarea className="pa-textarea" rows="3" value={formCrear.descripcion}
                            onChange={e => setFormCrear({...formCrear, descripcion: e.target.value})} />
                        </div>
                      </div>
                      <div className="pa-form-row">
                        <div className="pa-form-field">
                          <label className="pa-label">Empresa *</label>
                          <input className="pa-input" type="text" value={formCrear.empresa}
                            onChange={e => setFormCrear({...formCrear, empresa: e.target.value})} required />
                        </div>
                        <div className="pa-form-field">
                          <label className="pa-label">Dirección Empresa</label>
                          <input className="pa-input" type="text" value={formCrear.direccion_empresa}
                            onChange={e => setFormCrear({...formCrear, direccion_empresa: e.target.value})} />
                        </div>
                      </div>
                      <div className="pa-form-row">
                        <div className="pa-form-field">
                          <label className="pa-label">Supervisor en la Empresa</label>
                          <input className="pa-input" type="text" value={formCrear.supervisor_empresa}
                            onChange={e => setFormCrear({...formCrear, supervisor_empresa: e.target.value})} />
                        </div>
                        <div className="pa-form-field">
                          <label className="pa-label">Teléfono Supervisor</label>
                          <input className="pa-input" type="text" value={formCrear.telefono_supervisor}
                            onChange={e => setFormCrear({...formCrear, telefono_supervisor: e.target.value})} />
                        </div>
                      </div>
                    </div>

                    <div className="pa-form-group">
                      <h2 className="pa-h2">Fechas y Tutor</h2>
                      <div className="pa-form-row">
                        <div className="pa-form-field">
                          <label className="pa-label">Fecha Inicio *</label>
                          <input className="pa-input" type="date" value={formCrear.fecha_inicio}
                            onChange={e => setFormCrear({...formCrear, fecha_inicio: e.target.value})} required />
                        </div>
                        <div className="pa-form-field">
                          <label className="pa-label">Fecha Fin *</label>
                          <input className="pa-input" type="date" value={formCrear.fecha_fin}
                            onChange={e => setFormCrear({...formCrear, fecha_fin: e.target.value})} required />
                        </div>
                      </div>
                      <div className="pa-form-row">
                        <div className="pa-form-field">
                          <label className="pa-label">Tutor Asignado</label>
                          <select className="pa-select" value={formCrear.tutor_id}
                            onChange={e => setFormCrear({...formCrear, tutor_id: e.target.value})}>
                            <option value="">-- Sin tutor --</option>
                            {tutores.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                          </select>
                        </div>
                        <div className="pa-form-field">
                          <label className="pa-label">Documento (PDF/DOC)</label>
                          <input className="pa-file-input" type="file" accept=".pdf,.doc,.docx"
                            onChange={e => setFormCrear({...formCrear, archivo_documento: e.target.files[0]})} />
                        </div>
                      </div>
                    </div>

                    <div className="pa-form-actions">
                      <button type="submit" className="pa-btn-primary">Registrar Pasantía</button>
                      <button type="button" className="pa-btn-secondary" onClick={cambiarEstudiante}>Cancelar</button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB LISTAR */}
            {activeTab === 'listar' && (
              <div className="pa-tab-content">
                <div className="pa-search-filter">
                  <input className="pa-input" type="text" placeholder="Buscar por estudiante, título, empresa..."
                    value={searchPasantia} onChange={e => setSearchPasantia(e.target.value)} />
                  <select className="pa-select" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                    <option value="">Todos los estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="en_revision">En Revisión</option>
                    <option value="aprobada">Aprobada</option>
                    <option value="en_proceso">En proceso</option>
                    <option value="finalizada">Finalizada</option>
                    <option value="rechazada">Rechazada</option>
                  </select>
                </div>
                <div className="pa-table-responsive">
                  <table className="pa-tabla">
                    <thead>
                      <tr>
                        <th>Estudiante</th>
                        <th>Título</th>
                        <th>Empresa</th>
                        <th>Estado</th>
                        <th>Fechas</th>
                        <th>Tutor</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pasantiasFiltradas.length === 0 ? <tr><td colSpan="7" style={{textAlign:'center'}}>No hay pasantías registradas.</td></tr> :
                        pasantiasFiltradas.map(p => (
                          <tr key={p.id}>
                            <td><strong>{p.estudiante_nombre || 'N/A'}</strong></td>
                            <td>{p.titulo}</td>
                            <td>{p.empresa}</td>
                            <td>
                              <span className={`pa-estado-badge pa-estado-${p.estado || 'pendiente'}`}>
                                {(p.estado || 'pendiente').replace('_', ' ')}
                              </span>
                            </td>
                            <td style={{fontSize:'0.9rem'}}>{formatearFecha(p.fecha_inicio)}<br/>{formatearFecha(p.fecha_fin)}</td>
                            <td>{p.tutor_nombre || 'No asignado'}</td>
                            <td style={{display:'flex', gap:'8px'}}>
                              <button className="pa-btn-ver" onClick={() => abrirVer(p)}>Ver</button>
                              <button className="pa-btn-editar" onClick={() => abrirEditar(p)}>Editar</button>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL VER */}
      <div className={`pa-modal-overlay${modalVer ? ' open' : ''}`} onClick={e => e.target === e.currentTarget && setModalVer(false)}>
        <div className="pa-modal-content">
          <button className="pa-modal-close" onClick={() => setModalVer(false)}>×</button>
          <h2 className="pa-modal-title">Detalles de la Pasantía</h2>
          {pasantiaActual && (
            <>
              <div className="pa-detalle-grid">
                <div className="pa-detalle-box">
                  <h4>Estudiante</h4>
                  <p><strong>Nombre:</strong> {pasantiaActual.estudiante_nombre}</p>
                  <p><strong>Email:</strong> {pasantiaActual.estudiante_email}</p>
                  <p><strong>Doc:</strong> {pasantiaActual.estudiante_documento}</p>
                </div>
                <div className="pa-detalle-box">
                  <h4>Estado y Fechas</h4>
                  <p><strong>Estado:</strong> <span className={`pa-estado-badge pa-estado-${pasantiaActual.estado}`}>{pasantiaActual.estado}</span></p>
                  <p><strong>Inicio:</strong> {formatearFecha(pasantiaActual.fecha_inicio)}</p>
                  <p><strong>Fin:</strong> {formatearFecha(pasantiaActual.fecha_fin)}</p>
                </div>
                <div className="pa-detalle-box">
                  <h4>Empresa</h4>
                  <p><strong>Nombre:</strong> {pasantiaActual.empresa}</p>
                  <p><strong>Supervisor:</strong> {pasantiaActual.supervisor_empresa}</p>
                  <p><strong>Tel. Sup:</strong> {pasantiaActual.telefono_supervisor}</p>
                </div>
                <div className="pa-detalle-box">
                  <h4>Tutor y Documento</h4>
                  <p><strong>Tutor:</strong> {pasantiaActual.tutor_nombre || 'No asignado'}</p>
                  {pasantiaActual.archivo_documento ? (
                    <p><strong>Documento:</strong> <a className="pa-archivo-link" href={`http://localhost:8000/storage/pasantias/${pasantiaActual.archivo_documento}`} target="_blank" rel="noreferrer">Ver archivo</a></p>
                  ) : <p>Sin archivo adjunto</p>}
                </div>
                <div className="pa-descripcion-box">
                  <h4>Título: {pasantiaActual.titulo}</h4>
                  <p style={{whiteSpace:'pre-wrap'}}>{pasantiaActual.descripcion || 'Sin descripción detallada.'}</p>
                </div>
              </div>
              <div className="pa-form-actions" style={{justifyContent: 'flex-end'}}>
                <button className="pa-btn-editar" onClick={() => { setModalVer(false); abrirEditar(pasantiaActual); }}>Editar Pasantía</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL EDITAR */}
      <div className={`pa-modal-overlay${modalEditar ? ' open' : ''}`} onClick={e => e.target === e.currentTarget && setModalEditar(false)}>
        <div className="pa-modal-content">
          <button className="pa-modal-close" onClick={() => setModalEditar(false)}>×</button>
          <h2 className="pa-modal-title">Editar Pasantía</h2>
          {pasantiaActual && (
            <form onSubmit={handleEditar}>
              <div className="pa-form-group">
                <div className="pa-form-row">
                  <div className="pa-form-field pa-full-width">
                    <label className="pa-label">Título *</label>
                    <input className="pa-input" type="text" value={formEditar.titulo}
                      onChange={e => setFormEditar({...formEditar, titulo: e.target.value})} required />
                  </div>
                </div>
                <div className="pa-form-row">
                  <div className="pa-form-field">
                    <label className="pa-label">Empresa *</label>
                    <input className="pa-input" type="text" value={formEditar.empresa}
                      onChange={e => setFormEditar({...formEditar, empresa: e.target.value})} required />
                  </div>
                  <div className="pa-form-field">
                    <label className="pa-label">Supervisor Empresa</label>
                    <input className="pa-input" type="text" value={formEditar.supervisor_empresa}
                      onChange={e => setFormEditar({...formEditar, supervisor_empresa: e.target.value})} />
                  </div>
                </div>
                <div className="pa-form-row">
                  <div className="pa-form-field pa-full-width">
                    <label className="pa-label">Descripción</label>
                    <textarea className="pa-textarea" rows="3" value={formEditar.descripcion}
                      onChange={e => setFormEditar({...formEditar, descripcion: e.target.value})} />
                  </div>
                </div>
                <div className="pa-form-row">
                  <div className="pa-form-field">
                    <label className="pa-label">Estado *</label>
                    <select className="pa-select" value={formEditar.estado}
                      onChange={e => setFormEditar({...formEditar, estado: e.target.value})} required>
                      <option value="pendiente">Pendiente</option>
                      <option value="en_revision">En Revisión</option>
                      <option value="aprobada">Aprobada</option>
                      <option value="en_proceso">En Proceso</option>
                      <option value="finalizada">Finalizada</option>
                      <option value="rechazada">Rechazada</option>
                    </select>
                  </div>
                  <div className="pa-form-field">
                    <label className="pa-label">Tutor</label>
                    <select className="pa-select" value={formEditar.tutor_id}
                      onChange={e => setFormEditar({...formEditar, tutor_id: e.target.value})}>
                      <option value="">-- Sin tutor --</option>
                      {tutores.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                  </div>
                </div>
                <div className="pa-form-row">
                  <div className="pa-form-field pa-full-width">
                    <label className="pa-label">Nuevo Documento (opcional)</label>
                    <input className="pa-file-input" type="file" accept=".pdf,.doc,.docx"
                      onChange={e => setFormEditar({...formEditar, archivo_documento: e.target.files[0]})} />
                    {pasantiaActual.archivo_documento && (
                      <p className="pa-info-text">Actual: <a href={`http://localhost:8000/storage/pasantias/${pasantiaActual.archivo_documento}`} target="_blank" rel="noreferrer">Ver Archivo</a> (Subir uno nuevo lo reemplaza)</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="pa-form-actions">
                <button type="submit" className="pa-btn-primary">Guardar Cambios</button>
                <button type="button" className="pa-btn-secondary" onClick={() => setModalEditar(false)}>Cancelar</button>
                <button type="button" className="pa-btn-danger" onClick={() => { setModalEditar(false); setModalEliminar(true); }}>Eliminar</button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* MODAL ELIMINAR */}
      <div className={`pa-modal-overlay${modalEliminar ? ' open' : ''}`} onClick={e => e.target === e.currentTarget && setModalEliminar(false)}>
        <div className="pa-modal-content pa-modal-small">
          <button className="pa-modal-close" onClick={() => setModalEliminar(false)}>×</button>
          <h2 className="pa-modal-title">Confirmar Eliminación</h2>
          <p style={{textAlign:'center', marginBottom:'24px', color:'#3A3A3A'}}>
            ¿Seguro que desea eliminar esta pasantía?<br/>
            <span style={{color:'#B91C1C', fontSize:'0.9rem'}}>Esta acción no se puede deshacer.</span>
          </p>
          <div className="pa-form-actions" style={{justifyContent:'center'}}>
            <button className="pa-btn-danger" onClick={handleEliminar}>Sí, Eliminar</button>
            <button className="pa-btn-secondary" onClick={() => setModalEliminar(false)}>Cancelar</button>
          </div>
        </div>
      </div>

    </div>
  );
}
