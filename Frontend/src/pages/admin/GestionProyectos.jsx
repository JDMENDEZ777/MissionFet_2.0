import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './GestionProyectos.css';

export default function GestionProyectos() {
  const navigate = useNavigate();
  const [navActive, setNavActive] = useState(false);
  const [activeTab, setActiveTab] = useState('crear');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [loading, setLoading] = useState(true);

  // Datos
  const [proyectos, setProyectos] = useState([]);
  const [tutores, setTutores] = useState([]);
  const [estudiantesDisponibles, setEstudiantesDisponibles] = useState([]);
  const [todosEstudiantes, setTodosEstudiantes] = useState([]);

  // Filtros listar
  const [searchProyecto, setSearchProyecto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Filtro crear
  const [searchEst, setSearchEst] = useState('');

  // Form crear
  const [formCrear, setFormCrear] = useState({
    titulo: '', descripcion: '', tutor_id: '', archivo: null, estudiantes: []
  });

  // Modales
  const [modalVer, setModalVer] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [proyectoActual, setProyectoActual] = useState(null);

  // Form editar
  const [formEditar, setFormEditar] = useState({
    titulo: '', descripcion: '', estado: 'propuesto', tutor_id: '', archivo: null, estudiantes: []
  });
  const [searchEstEdit, setSearchEstEdit] = useState('');

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [rForm, rProy] = await Promise.all([
        api.get('/admin/proyectos/form-data'),
        api.get('/admin/proyectos')
      ]);
      setTutores(Array.isArray(rForm.data.tutores) ? rForm.data.tutores : []);
      setEstudiantesDisponibles(Array.isArray(rForm.data.estudiantes) ? rForm.data.estudiantes : []);
      setTodosEstudiantes(Array.isArray(rForm.data.todos_estudiantes) ? rForm.data.todos_estudiantes : rForm.data.estudiantes || []);
      setProyectos(Array.isArray(rProy.data) ? rProy.data : []);
    } catch {
      mostrarMensaje('Error al cargar datos del servidor', 'error');
    } finally { setLoading(false); }
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 5000);
  };

  const toggleEst = (id, esEdit = false) => {
    const setter = esEdit ? setFormEditar : setFormCrear;
    setter(prev => {
      const sel = prev.estudiantes;
      if (sel.includes(id)) return { ...prev, estudiantes: sel.filter(x => x !== id) };
      if (sel.length >= 3) { alert('Máximo 3 estudiantes por proyecto.'); return prev; }
      return { ...prev, estudiantes: [...sel, id] };
    });
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (formCrear.estudiantes.length === 0) { alert('Selecciona al menos un estudiante.'); return; }
    const fd = new FormData();
    fd.append('titulo', formCrear.titulo);
    fd.append('descripcion', formCrear.descripcion);
    fd.append('tutor_id', formCrear.tutor_id);
    fd.append('estudiantes', JSON.stringify(formCrear.estudiantes));
    if (formCrear.archivo) fd.append('archivo_proyecto', formCrear.archivo);
    try {
      await api.post('/admin/proyectos', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      mostrarMensaje('Proyecto creado exitosamente ✓', 'exito');
      setFormCrear({ titulo: '', descripcion: '', tutor_id: '', archivo: null, estudiantes: [] });
      setSearchEst('');
      cargarDatos();
      setActiveTab('listar');
    } catch (err) {
      mostrarMensaje(err?.response?.data?.message || 'Error al crear el proyecto', 'error');
    }
  };

  const abrirVer = (p) => { setProyectoActual(p); setModalVer(true); };

  const abrirEditar = (p) => {
    setProyectoActual(p);
    const estAsignados = Array.isArray(p.estudiantes) ? p.estudiantes.map(e => e.estudiante_id) : [];
    setFormEditar({ titulo: p.titulo || '', descripcion: p.descripcion || '', estado: p.estado || 'propuesto', tutor_id: p.tutor_id || '', archivo: null, estudiantes: estAsignados });
    setSearchEstEdit('');
    setModalEditar(true);
  };

  const handleEditar = async (e) => {
    e.preventDefault();
    if (formEditar.estudiantes.length === 0) { alert('Selecciona al menos un estudiante.'); return; }
    const fd = new FormData();
    fd.append('titulo', formEditar.titulo);
    fd.append('descripcion', formEditar.descripcion);
    fd.append('estado', formEditar.estado);
    fd.append('tutor_id', formEditar.tutor_id);
    fd.append('estudiantes', JSON.stringify(formEditar.estudiantes));
    if (formEditar.archivo) fd.append('archivo_proyecto', formEditar.archivo);
    try {
      await api.post(`/admin/proyectos/${proyectoActual.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      mostrarMensaje('Proyecto actualizado exitosamente ✓', 'exito');
      setModalEditar(false);
      cargarDatos();
    } catch (err) {
      mostrarMensaje(err?.response?.data?.message || 'Error al actualizar', 'error');
    }
  };

  const handleEliminar = async () => {
    try {
      await api.delete(`/admin/proyectos/${proyectoActual.id}`);
      mostrarMensaje('Proyecto eliminado ✓', 'exito');
      setModalEliminar(false);
      setModalEditar(false);
      cargarDatos();
    } catch {
      mostrarMensaje('Error al eliminar el proyecto', 'error');
    }
  };

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };

  const estFiltradosCrear = estudiantesDisponibles.filter(e =>
    !searchEst || (e.nombre || '').toLowerCase().includes(searchEst.toLowerCase())
  );

  const estParaEditar = todosEstudiantes.filter(e =>
    !searchEstEdit || (e.nombre || '').toLowerCase().includes(searchEstEdit.toLowerCase())
  );

  const proyectosFiltrados = proyectos.filter(p => {
    const matchSearch = !searchProyecto || (p.titulo || '').toLowerCase().includes(searchProyecto.toLowerCase());
    const matchEstado = !filtroEstado || p.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  const getLiderBadge = (id, lista) => lista[0] === id;

  const getNombreEst = (id, lista) => {
    const found = lista.find(e => e.id === id);
    return found ? found.nombre : `ID:${id}`;
  };

  return (
    <div className="modulo-gestion-proyectos">
      {/* LOGO */}
      <div id="gp-logo" onClick={() => setNavActive(!navActive)}>
        <img src="/IMG/logofet.png" alt="Logo FET" className="gp-logo-img" />
      </div>

      {/* NAVBAR */}
      <nav id="gp-navbar" className={navActive ? 'active' : ''}>
        <div className="gp-nav-header">
          <div id="gp-nav-logo"><img src="/IMG/logofet.png" alt="Logo FET" className="gp-logo-img" /></div>
          <ul>
            <li><Link to="/dashboard">Inicio</Link></li>
            <li><Link to="/aprobacion">Aprobación de Usuarios</Link></li>
            <li><Link to="/usuarios">Gestión de Usuarios</Link></li>
            <li className="gp-dropdown">
              <a href="#">Gestión de Modalidades de Grado</a>
              <ul className="gp-dropdown-content">
                <li><Link to="/seminarios">Seminario</Link></li>
                <li><Link to="/proyectos" className="active">Proyectos</Link></li>
                <li><Link to="/pasantias">Pasantías</Link></li>
              </ul>
            </li>
            <li><Link to="/reportes">Reportes y Estadísticas</Link></li>
            <li><a href="#" onClick={handleLogout}>Cerrar Sesión</a></li>
          </ul>
        </div>
      </nav>

      {/* MAIN */}
      <main className={`gp-main${navActive ? ' nav-active' : ''}`}>
        <h1 className="gp-h1">Gestión de Proyectos</h1>

        {mensaje.texto && <div className={`gp-mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>}

        {loading ? <p className="gp-loading">⏳ Cargando datos...</p> : (
          <>
            {/* TABS */}
            <div className="gp-tabs">
              <button className={activeTab === 'crear' ? 'active' : ''} onClick={() => setActiveTab('crear')}>Crear Proyecto</button>
              <button className={activeTab === 'listar' ? 'active' : ''} onClick={() => setActiveTab('listar')}>Listar Proyectos</button>
            </div>

            {/* TAB CREAR */}
            {activeTab === 'crear' && (
              <div className="gp-tab-content">
                <form onSubmit={handleCrear}>
                  <div className="gp-form-group">
                    <h2 className="gp-h2">Información del Proyecto</h2>
                    <div className="gp-form-row">
                      <div className="gp-form-field gp-full-width">
                        <label className="gp-label">Título del Proyecto *</label>
                        <input className="gp-input" type="text" value={formCrear.titulo}
                          onChange={e => setFormCrear({ ...formCrear, titulo: e.target.value })} required />
                      </div>
                    </div>
                    <div className="gp-form-row">
                      <div className="gp-form-field gp-full-width">
                        <label className="gp-label">Descripción *</label>
                        <textarea className="gp-textarea" rows="4" value={formCrear.descripcion}
                          onChange={e => setFormCrear({ ...formCrear, descripcion: e.target.value })} required />
                      </div>
                    </div>
                    <div className="gp-form-row">
                      <div className="gp-form-field">
                        <label className="gp-label">Tutor Asignado *</label>
                        <select className="gp-select" value={formCrear.tutor_id}
                          onChange={e => setFormCrear({ ...formCrear, tutor_id: e.target.value })} required>
                          <option value="">-- Seleccione un tutor --</option>
                          {tutores.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                        </select>
                      </div>
                      <div className="gp-form-field">
                        <label className="gp-label">Archivo del Proyecto (PDF, DOC)</label>
                        <input className="gp-file-input" type="file" accept=".pdf,.doc,.docx"
                          onChange={e => setFormCrear({ ...formCrear, archivo: e.target.files[0] })} />
                        <p className="gp-info-text">Formatos: PDF, DOC, DOCX. Máx: 10MB</p>
                      </div>
                    </div>
                  </div>

                  <div className="gp-form-group">
                    <h2 className="gp-h2">Asignación de Estudiantes</h2>
                    <p className="gp-info-text">Seleccione 1 a 3 estudiantes. El primero seleccionado será el Líder 👑</p>
                    <div className="gp-search-filter">
                      <input className="gp-input" type="text" placeholder="Buscar estudiante..."
                        value={searchEst} onChange={e => setSearchEst(e.target.value)} />
                    </div>
                    <div className="gp-estudiantes-container">
                      {estFiltradosCrear.length === 0
                        ? <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#6B7280' }}>No hay estudiantes disponibles con opción de grado "proyecto".</p>
                        : estFiltradosCrear.map(est => (
                          <div key={est.id} className={`gp-estudiante-card${formCrear.estudiantes.includes(est.id) ? ' selected' : ''}`}
                            onClick={() => toggleEst(est.id)}>
                            <div className="gp-estudiante-info">
                              <h3>{est.nombre}</h3>
                              <p>Código: {est.codigo_estudiante || 'N/A'}</p>
                              <p>Email: {est.email}</p>
                            </div>
                            <div className="gp-estudiante-select">
                              <input type="checkbox" className="gp-estudiante-checkbox"
                                checked={formCrear.estudiantes.includes(est.id)}
                                onChange={() => toggleEst(est.id)}
                                onClick={ev => ev.stopPropagation()} />
                            </div>
                          </div>
                        ))
                      }
                    </div>
                    <div className="gp-seleccionados-box">
                      <h3>Seleccionados: {formCrear.estudiantes.length}/3</h3>
                      <ul>
                        {formCrear.estudiantes.map((id, i) => (
                          <li key={id}>
                            {i === 0 && <span className="gp-lider-badge">Líder 👑</span>}
                            {getNombreEst(id, estudiantesDisponibles)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="gp-form-actions">
                    <button type="submit" className="gp-btn-primary">Crear Proyecto</button>
                    <button type="button" className="gp-btn-secondary"
                      onClick={() => { setFormCrear({ titulo: '', descripcion: '', tutor_id: '', archivo: null, estudiantes: [] }); setSearchEst(''); }}>
                      Limpiar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB LISTAR */}
            {activeTab === 'listar' && (
              <div className="gp-tab-content">
                <div className="gp-search-filter">
                  <input className="gp-input" type="text" placeholder="Buscar por título..."
                    value={searchProyecto} onChange={e => setSearchProyecto(e.target.value)} />
                  <select className="gp-select" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                    <option value="">Todos los estados</option>
                    <option value="propuesto">Propuesto</option>
                    <option value="en_revision">En Revisión</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="finalizado">Finalizado</option>
                    <option value="rechazado">Rechazado</option>
                  </select>
                </div>
                <div className="gp-proyectos-grid">
                  {proyectosFiltrados.length === 0
                    ? <div className="gp-no-proyectos">No hay proyectos registrados.</div>
                    : proyectosFiltrados.map(p => (
                      <div key={p.id} className="gp-proyecto-card">
                        <div className={`gp-proyecto-header gp-estado-${p.estado || 'propuesto'}`}>
                          <h3>{p.titulo}</h3>
                          <span className="gp-proyecto-estado">{(p.estado || '').replace(/_/g, ' ')}</span>
                        </div>
                        <div className="gp-proyecto-body">
                          <p><strong>Estudiantes:</strong> {p.num_estudiantes ?? 0}/3</p>
                          <p><strong>Tutor:</strong> {p.tutor_nombre || 'No asignado'}</p>
                          <p><strong>Tipo:</strong> {p.tipo || 'Proyecto'}</p>
                          {p.archivo_proyecto && (
                            <p><strong>Archivo:</strong>{' '}
                              <a className="gp-archivo-link" href={`http://localhost:8000/storage/proyectos/${p.archivo_proyecto}`}
                                target="_blank" rel="noreferrer">Ver archivo</a>
                            </p>
                          )}
                          <div className="gp-proyecto-descripcion">
                            {(p.descripcion || '').substring(0, 100)}{(p.descripcion || '').length > 100 ? '...' : ''}
                          </div>
                        </div>
                        <div className="gp-proyecto-footer">
                          <button className="gp-btn-ver" onClick={() => abrirVer(p)}>Ver Detalles</button>
                          <button className="gp-btn-editar" onClick={() => abrirEditar(p)}>Editar</button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL VER */}
      <div className={`gp-modal-overlay${modalVer ? ' open' : ''}`} onClick={e => e.target === e.currentTarget && setModalVer(false)}>
        <div className="gp-modal-content">
          <button className="gp-modal-close" onClick={() => setModalVer(false)}>×</button>
          <h2 className="gp-modal-title">Detalles del Proyecto</h2>
          {proyectoActual && (
            <>
              <div className={`gp-detalle-header gp-estado-${proyectoActual.estado || 'propuesto'}`}>
                <h3>{proyectoActual.titulo}</h3>
                <span className="gp-proyecto-estado">{(proyectoActual.estado || '').replace(/_/g, ' ')}</span>
              </div>
              <div className="gp-detalle-body">
                <p><strong>ID:</strong> {proyectoActual.id}</p>
                <p><strong>Tutor:</strong> {proyectoActual.tutor_nombre || 'No asignado'}</p>
                <p><strong>Tipo:</strong> {proyectoActual.tipo || 'Proyecto'}</p>
                {proyectoActual.archivo_proyecto && (
                  <p><strong>Archivo:</strong>{' '}
                    <a className="gp-archivo-link" href={`http://localhost:8000/storage/proyectos/${proyectoActual.archivo_proyecto}`}
                      target="_blank" rel="noreferrer">{proyectoActual.archivo_proyecto}</a>
                  </p>
                )}
                <h4>Descripción:</h4>
                <div className="gp-descripcion-box">{proyectoActual.descripcion || 'Sin descripción'}</div>
                <h4>Estudiantes asignados:</h4>
                {Array.isArray(proyectoActual.estudiantes) && proyectoActual.estudiantes.length > 0 ? (
                  <ul className="gp-estudiantes-lista">
                    {proyectoActual.estudiantes.map((est, i) => (
                      <li key={est.estudiante_id}>
                        {est.rol_en_proyecto === 'líder' ? '👑 ' : ''}{est.estudiante_nombre} ({est.estudiante_email})
                        {est.rol_en_proyecto === 'líder' ? ' — Líder' : ''}
                      </li>
                    ))}
                  </ul>
                ) : <p>No hay estudiantes asignados.</p>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL EDITAR */}
      <div className={`gp-modal-overlay${modalEditar ? ' open' : ''}`} onClick={e => e.target === e.currentTarget && setModalEditar(false)}>
        <div className="gp-modal-content">
          <button className="gp-modal-close" onClick={() => setModalEditar(false)}>×</button>
          <h2 className="gp-modal-title">Editar Proyecto</h2>
          {proyectoActual && (
            <form onSubmit={handleEditar}>
              <div className="gp-form-row">
                <div className="gp-form-field gp-full-width">
                  <label className="gp-label">Título *</label>
                  <input className="gp-input" type="text" value={formEditar.titulo}
                    onChange={e => setFormEditar({ ...formEditar, titulo: e.target.value })} required />
                </div>
              </div>
              <div className="gp-form-row">
                <div className="gp-form-field">
                  <label className="gp-label">Estado *</label>
                  <select className="gp-select" value={formEditar.estado}
                    onChange={e => setFormEditar({ ...formEditar, estado: e.target.value })} required>
                    <option value="propuesto">Propuesto</option>
                    <option value="en_revision">En Revisión</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="finalizado">Finalizado</option>
                    <option value="rechazado">Rechazado</option>
                  </select>
                </div>
                <div className="gp-form-field">
                  <label className="gp-label">Tutor *</label>
                  <select className="gp-select" value={formEditar.tutor_id}
                    onChange={e => setFormEditar({ ...formEditar, tutor_id: e.target.value })} required>
                    <option value="">-- Seleccione --</option>
                    {tutores.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="gp-form-row">
                <div className="gp-form-field gp-full-width">
                  <label className="gp-label">Descripción *</label>
                  <textarea className="gp-textarea" rows="4" value={formEditar.descripcion}
                    onChange={e => setFormEditar({ ...formEditar, descripcion: e.target.value })} required />
                </div>
              </div>
              <div className="gp-form-row">
                <div className="gp-form-field gp-full-width">
                  <label className="gp-label">Nuevo Archivo (opcional)</label>
                  <input className="gp-file-input" type="file" accept=".pdf,.doc,.docx"
                    onChange={e => setFormEditar({ ...formEditar, archivo: e.target.files[0] })} />
                  {proyectoActual.archivo_proyecto && (
                    <div className="gp-archivo-actual">
                      Archivo actual:{' '}
                      <a className="gp-archivo-link" href={`http://localhost:8000/storage/proyectos/${proyectoActual.archivo_proyecto}`}
                        target="_blank" rel="noreferrer">{proyectoActual.archivo_proyecto}</a>
                      {' '}(subir uno nuevo lo reemplazará)
                    </div>
                  )}
                </div>
              </div>

              {/* Estudiantes en editar */}
              <div className="gp-form-group" style={{ marginTop: '16px' }}>
                <h2 className="gp-h2">Estudiantes Asignados</h2>
                <p className="gp-info-text">Seleccione 1 a 3 estudiantes. El primero será el Líder 👑</p>
                <div className="gp-seleccionados-box" style={{ marginBottom: '14px' }}>
                  <h3>Seleccionados: {formEditar.estudiantes.length}/3</h3>
                  <ul>
                    {formEditar.estudiantes.map((id, i) => (
                      <li key={id}>
                        {i === 0 && <span className="gp-lider-badge">Líder 👑</span>}
                        {getNombreEst(id, todosEstudiantes.length > 0 ? todosEstudiantes : estudiantesDisponibles)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="gp-search-filter">
                  <input className="gp-input" type="text" placeholder="Buscar estudiante..."
                    value={searchEstEdit} onChange={e => setSearchEstEdit(e.target.value)} />
                </div>
                <div className="gp-estudiantes-container">
                  {estParaEditar.map(est => (
                    <div key={est.id} className={`gp-estudiante-card${formEditar.estudiantes.includes(est.id) ? ' selected' : ''}`}
                      onClick={() => toggleEst(est.id, true)}>
                      <div className="gp-estudiante-info">
                        <h3>{est.nombre}</h3>
                        <p>Código: {est.codigo_estudiante || 'N/A'}</p>
                        <p>Email: {est.email}</p>
                      </div>
                      <div className="gp-estudiante-select">
                        <input type="checkbox" className="gp-estudiante-checkbox"
                          checked={formEditar.estudiantes.includes(est.id)}
                          onChange={() => toggleEst(est.id, true)}
                          onClick={ev => ev.stopPropagation()} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="gp-form-actions">
                <button type="submit" className="gp-btn-primary">Guardar Cambios</button>
                <button type="button" className="gp-btn-secondary" onClick={() => setModalEditar(false)}>Cancelar</button>
                <button type="button" className="gp-btn-danger"
                  onClick={() => { setModalEditar(false); setModalEliminar(true); }}>
                  Eliminar Proyecto
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* MODAL CONFIRMAR ELIMINAR */}
      <div className={`gp-modal-overlay${modalEliminar ? ' open' : ''}`} onClick={e => e.target === e.currentTarget && setModalEliminar(false)}>
        <div className="gp-modal-content gp-modal-small">
          <button className="gp-modal-close" onClick={() => setModalEliminar(false)}>×</button>
          <h2 className="gp-modal-title">Confirmar Eliminación</h2>
          <p style={{ textAlign: 'center', marginBottom: '24px', color: '#3A3A3A' }}>
            ¿Está seguro de eliminar el proyecto <strong>"{proyectoActual?.titulo}"</strong>?<br />
            <span style={{ color: '#B91C1C', fontSize: '0.9rem' }}>Esta acción no se puede deshacer.</span>
          </p>
          <div className="gp-form-actions" style={{ justifyContent: 'center' }}>
            <button className="gp-btn-danger" onClick={handleEliminar}>Sí, Eliminar</button>
            <button className="gp-btn-secondary" onClick={() => setModalEliminar(false)}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}