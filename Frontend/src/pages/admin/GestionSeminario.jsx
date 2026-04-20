import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './GestionSeminario.css';  

export default function GestionSeminario() {
  const navigate = useNavigate();
  const [navActive, setNavActive] = useState(false);
  
  const [activeTab, setActiveTab] = useState('listar'); 
  const [seminarios, setSeminarios] = useState([]);
  const [tutores, setTutores] = useState([]);
  const [mensaje, setMensaje] = useState({ text: '', type: '' });
  const [filtros, setFiltros] = useState({ search: '', estado: '', modalidad: '' });

  const [modalVer, setModalVer] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [seminarioSeleccionado, setSeminarioSeleccionado] = useState(null);
  
  const [estudiantesInscritos, setEstudiantesInscritos] = useState([]);
  const [estudiantesDisponibles, setEstudiantesDisponibles] = useState([]);
  const [mostrarDisponibles, setMostrarDisponibles] = useState(false);
  const [searchEstudiante, setSearchEstudiante] = useState('');

  const [formCrear, setFormCrear] = useState({
    titulo: '', descripcion: '', fecha: '', hora: '', modalidad: '', lugar: '', cupos: 30, tutor_id: '', archivo_guia: null
  });
  const [formEditar, setFormEditar] = useState({});

  useEffect(() => {
    fetchDatosIniciales();
  }, []);

  const fetchDatosIniciales = async () => {
    try {
      const [resSeminarios, resTutores] = await Promise.all([
        api.get('/admin/seminarios'),
        api.get('/admin/tutores')
      ]);
      setSeminarios(resSeminarios.data);
      setTutores(resTutores.data);
    } catch (error) {
      mostrarMensaje('Error al cargar los datos', 'error');
    }
  };

  const mostrarMensaje = (text, type) => {
    setMensaje({ text, type });
    window.scrollTo(0, 0);
    setTimeout(() => setMensaje({ text: '', type: '' }), 5000);
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(formCrear).forEach(key => {
      if (formCrear[key] !== null && formCrear[key] !== '') {
        formData.append(key, formCrear[key]);
      }
    });

    try {
      await api.post('/admin/seminarios', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      mostrarMensaje('Seminario creado exitosamente', 'exito');
      setFormCrear({titulo: '', descripcion: '', fecha: '', hora: '', modalidad: '', lugar: '', cupos: 30, tutor_id: '', archivo_guia: null});
      fetchDatosIniciales();
      setActiveTab('listar');
    } catch (error) {
      mostrarMensaje(error.response?.data?.message || 'Error al crear seminario', 'error');
    }
  };

  const abrirVerDetalles = async (id) => {
    try {
      const response = await api.get(`/admin/seminarios/${id}`);
      setSeminarioSeleccionado(response.data.seminario);
      setEstudiantesInscritos(response.data.estudiantes);
      setMostrarDisponibles(false);
      setModalVer(true);
    } catch (error) {
      mostrarMensaje('Error al cargar detalles', 'error');
    }
  };

  const cargarEstudiantesDisponibles = async () => {
    try {
      const response = await api.get(`/admin/seminarios/${seminarioSeleccionado.id}/disponibles`);
      setEstudiantesDisponibles(response.data);
      setMostrarDisponibles(true);
    } catch (error) {
      mostrarMensaje('Error al cargar estudiantes disponibles', 'error');
    }
  };

  const handleInscribir = async (estudianteId) => {
    try {
      await api.post(`/admin/seminarios/${seminarioSeleccionado.id}/inscribir`, { estudiante_id: estudianteId });
      abrirVerDetalles(seminarioSeleccionado.id);
      if(mostrarDisponibles) cargarEstudiantesDisponibles();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al inscribir');
    }
  };

  const handleEliminarInscripcion = async (estudianteId) => {
    if(!window.confirm('¿Eliminar a este estudiante del seminario?')) return;
    try {
      await api.delete(`/admin/seminarios/${seminarioSeleccionado.id}/inscripcion/${estudianteId}`);
      abrirVerDetalles(seminarioSeleccionado.id);
    } catch (error) {
      alert('Error al eliminar inscripción');
    }
  };

  const abrirEditar = (seminario) => {
    setFormEditar({
      id: seminario.id,
      titulo: seminario.titulo,
      descripcion: seminario.descripcion,
      fecha: seminario.fecha,
      hora: seminario.hora,
      modalidad: seminario.modalidad,
      lugar: seminario.lugar,
      cupos: seminario.cupos,
      tutor_id: seminario.tutor_id || '',
      estado: seminario.estado,
      archivo_guia: null 
    });
    setModalEditar(true);
  };

  const handleEditar = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('_method', 'PUT'); 

    Object.keys(formEditar).forEach(key => {
      if (formEditar[key] !== null && formEditar[key] !== '') {
        formData.append(key, formEditar[key]);
      }
    });

    try {
      await api.post(`/admin/seminarios/${formEditar.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      mostrarMensaje('Seminario actualizado exitosamente', 'exito');
      setModalEditar(false);
      fetchDatosIniciales();
    } catch (error) {
      mostrarMensaje('Error al actualizar el seminario', 'error');
    }
  };

  const handleEliminarSeminario = async () => {
    if (!window.confirm('¿Está seguro de eliminar este seminario? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/admin/seminarios/${formEditar.id}`);
      mostrarMensaje('Seminario eliminado correctamente', 'exito');
      setModalEditar(false);
      fetchDatosIniciales();
    } catch (error) {
      mostrarMensaje('Error al eliminar. Verifique que no tenga alumnos matriculados.', 'error');
    }
  };

  const seminariosFiltrados = seminarios.filter(s => {
    const matchSearch = s.titulo.toLowerCase().includes(filtros.search.toLowerCase());
    const matchEstado = filtros.estado ? s.estado === filtros.estado : true;
    const matchModalidad = filtros.modalidad ? s.modalidad === filtros.modalidad : true;
    return matchSearch && matchEstado && matchModalidad;
  });

  const estudiantesDisponiblesFiltrados = estudiantesDisponibles.filter(e => 
    e.nombre.toLowerCase().includes(searchEstudiante.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className={`admin-layout ${navActive ? 'nav-active' : ''}`}>
      
      <div id="logo" onClick={() => setNavActive(!navActive)}>
        <img src="/IMG/logofet.png" alt="Logo FET" className="logo-img" />
      </div>
      
      <nav id="navbar" className={navActive ? 'active' : ''}>
        <div className="nav-header">
          <div id="nav-logo" onClick={() => setNavActive(!navActive)}>
            <img src="/IMG/logofet.png" alt="Logo FET" className="logo-img" />
          </div>
          <ul>
            <li><Link to="/dashboard">Inicio</Link></li>
            <li><Link to="/aprobacion">Aprobación de Usuarios</Link></li>
            <li><Link to="/usuarios">Gestión de Usuarios</Link></li>
            <li className="dropdown active">
              <a href="#">Gestión de Modalidades de Grado</a>
              <ul className="dropdown-content" style={{display: 'block'}}>
                <li><Link to="/seminarios" className="active">Seminario</Link></li>
                <li><Link to="/proyectos">Proyectos</Link></li>
                <li><Link to="/pasantias">Pasantías</Link></li>
              </ul>
            </li>
            <li><Link to="/reportes">Reportes y Estadísticas</Link></li>
            <li><a href="#" onClick={handleLogout}>Cerrar Sesión</a></li>
          </ul>
        </div>
      </nav>

      <main className={navActive ? 'nav-active' : ''}>
        <h1>Gestión de Seminarios</h1>
        
        {mensaje.text && (
          <div className={`mensaje ${mensaje.type}`}>
            {mensaje.text}
          </div>
        )}

        <div className="tabs">
          <button className={activeTab === 'crear' ? 'active' : ''} onClick={() => setActiveTab('crear')}>
            Crear Seminario
          </button>
          <button className={activeTab === 'listar' ? 'active' : ''} onClick={() => setActiveTab('listar')}>
            Listar Seminarios
          </button>
        </div>

        {activeTab === 'crear' && (
          <section className="tab-content" style={{display: 'block'}}>
            <form onSubmit={handleCrear} encType="multipart/form-data">
              <div className="form-group">
                <h2>Información del Seminario</h2>
                
                <div className="form-row">
                  <div className="form-field full-width">
                    <label>Nombre o Tema del Seminario *</label>
                    <input type="text" value={formCrear.titulo} onChange={e => setFormCrear({...formCrear, titulo: e.target.value})} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field full-width">
                    <label>Descripción *</label>
                    <textarea rows="4" value={formCrear.descripcion} onChange={e => setFormCrear({...formCrear, descripcion: e.target.value})} required></textarea>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Fecha *</label>
                    <input type="date" value={formCrear.fecha} onChange={e => setFormCrear({...formCrear, fecha: e.target.value})} required />
                  </div>
                  <div className="form-field">
                    <label>Hora *</label>
                    <input type="time" value={formCrear.hora} onChange={e => setFormCrear({...formCrear, hora: e.target.value})} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Modalidad *</label>
                    <select value={formCrear.modalidad} onChange={e => setFormCrear({...formCrear, modalidad: e.target.value})} required>
                      <option value="">Seleccione una modalidad</option>
                      <option value="presencial">Presencial</option>
                      <option value="virtual">Virtual</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Lugar o Enlace *</label>
                    <input type="text" value={formCrear.lugar} onChange={e => setFormCrear({...formCrear, lugar: e.target.value})} placeholder={formCrear.modalidad === 'virtual' ? 'Enlace de la reunión' : 'Ubicación física'} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Cupos Disponibles</label>
                    <input type="number" min="1" value={formCrear.cupos} onChange={e => setFormCrear({...formCrear, cupos: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>Tutor Encargado</label>
                    <select value={formCrear.tutor_id} onChange={e => setFormCrear({...formCrear, tutor_id: e.target.value})}>
                      <option value="">Seleccione un tutor</option>
                      {tutores.map(t => (
                        <option key={t.id} value={t.id}>{t.name || t.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field full-width">
                    <label>Archivo Guía o Material (PDF o Word)</label>
                    <input type="file" accept=".pdf,.doc,.docx" onChange={e => setFormCrear({...formCrear, archivo_guia: e.target.files[0]})} />
                    <p className="info-text">Formatos permitidos: PDF, DOC, DOCX. Tamaño máximo: 10MB</p>
                  </div>
                </div>

              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Crear Seminario</button>
              </div>
            </form>
          </section>
        )}

        {activeTab === 'listar' && (
          <section className="tab-content" style={{display: 'block'}}>
            <div className="search-filter">
              <input type="text" placeholder="Buscar seminarios..." value={filtros.search} onChange={e => setFiltros({...filtros, search: e.target.value})} />
              <select value={filtros.estado} onChange={e => setFiltros({...filtros, estado: e.target.value})}>
                <option value="">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="finalizado">Finalizado</option>
                <option value="cancelado">Cancelado</option>
              </select>
              <select value={filtros.modalidad} onChange={e => setFiltros({...filtros, modalidad: e.target.value})}>
                <option value="">Todas las modalidades</option>
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
              </select>
            </div>

            <div className="seminarios-grid">
              {seminariosFiltrados.length === 0 ? (
                <div className="no-seminarios"><p>No hay seminarios registrados o que coincidan con la búsqueda.</p></div>
              ) : (
                seminariosFiltrados.map(seminario => (
                  <div key={seminario.id} className="seminario-card">
                    <div className={`seminario-header estado-${seminario.estado}`}>
                      <h3>{seminario.titulo}</h3>
                      <span className="seminario-estado">{seminario.estado}</span>
                    </div>
                    <div className="seminario-body">
                      <p><strong>Fecha:</strong> {seminario.fecha}</p>
                      <p><strong>Hora:</strong> {seminario.hora}</p>
                      <p><strong>Modalidad:</strong> {seminario.modalidad}</p>
                      <p><strong>Cupos:</strong> {seminario.num_inscritos}/{seminario.cupos}</p>
                      {seminario.archivo_guia && (
                        <p><strong>Material:</strong> <a href={`http://localhost:8000/storage/seminarios/${seminario.archivo_guia}`} target="_blank" rel="noreferrer" className="archivo-link">Ver material</a></p>
                      )}
                    </div>
                    <div className="seminario-footer">
                      <button className="btn-ver" onClick={() => abrirVerDetalles(seminario.id)}>Ver Detalles</button>
                      <button className="btn-editar" onClick={() => abrirEditar(seminario)}>Editar</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>

      {modalVer && seminarioSeleccionado && (
        <div className="modal" style={{display: 'block'}}>
          <div className="modal-content">
            <span className="close" onClick={() => setModalVer(false)}>&times;</span>
            <h2>Detalles del Seminario</h2>
            
            <div className="seminario-detalle">
              <div className={`seminario-header estado-${seminarioSeleccionado.estado}`}>
                <h3>{seminarioSeleccionado.titulo}</h3>
              </div>
              <div className="seminario-info" style={{marginTop: '15px'}}>
                <p><strong>Descripción:</strong> {seminarioSeleccionado.descripcion}</p>
                <p><strong>Lugar:</strong> {seminarioSeleccionado.lugar}</p>
              </div>
            </div>

            <div className="estudiantes-container">
              <div className="estudiantes-header">
                <h3>Estudiantes Inscritos ({estudiantesInscritos.length})</h3>
                <button className="btn-agregar-estudiantes" onClick={cargarEstudiantesDisponibles}>
                  + Agregar Estudiantes
                </button>
              </div>

              <div className="estudiantes-lista">
                {estudiantesInscritos.length === 0 ? (
                  <div className="no-estudiantes">No hay estudiantes inscritos.</div>
                ) : (
                  estudiantesInscritos.map(est => (
                    <div key={est.id} className="estudiante-item">
                        <div className="estudiante-info">
                          <strong>{est.nombre}</strong>
                          <p>{est.email}</p>
                        </div>
                        <button className="btn-eliminar-circular" onClick={() => handleEliminarInscripcion(est.id)}>🗑️</button>
                    </div>
                  ))
                )}
              </div>

              {mostrarDisponibles && (
                <div className="estudiantes-disponibles-section" style={{marginTop: '20px', background: '#f9f9f9', padding: '15px', borderRadius: '8px'}}>
                  <h3>Estudiantes Disponibles</h3>
                  <input type="text" placeholder="Buscar por nombre..." value={searchEstudiante} onChange={e => setSearchEstudiante(e.target.value)} className="search-estudiantes"/>
                  
                  <div className="estudiantes-disponibles">
                  {estudiantesDisponiblesFiltrados.length === 0 ? (
                    <p className="no-estudiantes">No hay estudiantes elegibles disponibles.</p>
                  ) : (
                    estudiantesDisponiblesFiltrados.map(est => (
                      <div key={est.id} className="estudiante-disponible">
                        <div className="estudiante-info">
                            <strong>{est.nombre}</strong>
                            <span>({est.documento})</span>
                        </div>
                        <button onClick={() => handleInscribir(est.id)}>Inscribir</button>
                      </div>
                    ))
                  )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {modalEditar && (
        <div className="modal" style={{display: 'block'}}>
          <div className="modal-content">
            <span className="close" onClick={() => setModalEditar(false)}>&times;</span>
            <h2>Editar Seminario</h2>
            <form onSubmit={handleEditar}>
              
              <div className="form-group">
                <div className="form-row">
                  <div className="form-field full-width">
                    <label>Nombre o Tema del Seminario *</label>
                    <input type="text" value={formEditar.titulo} onChange={e => setFormEditar({...formEditar, titulo: e.target.value})} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field full-width">
                    <label>Descripción *</label>
                    <textarea rows="4" value={formEditar.descripcion} onChange={e => setFormEditar({...formEditar, descripcion: e.target.value})} required></textarea>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Fecha *</label>
                    <input type="date" value={formEditar.fecha} onChange={e => setFormEditar({...formEditar, fecha: e.target.value})} required />
                  </div>
                  <div className="form-field">
                    <label>Hora *</label>
                    <input type="time" value={formEditar.hora} onChange={e => setFormEditar({...formEditar, hora: e.target.value})} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Modalidad *</label>
                    <select value={formEditar.modalidad} onChange={e => setFormEditar({...formEditar, modalidad: e.target.value})} required>
                      <option value="presencial">Presencial</option>
                      <option value="virtual">Virtual</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Lugar o Enlace *</label>
                    <input type="text" value={formEditar.lugar} onChange={e => setFormEditar({...formEditar, lugar: e.target.value})} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Cupos Disponibles</label>
                    <input type="number" min="1" value={formEditar.cupos} onChange={e => setFormEditar({...formEditar, cupos: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>Estado del Seminario *</label>
                    <select value={formEditar.estado} onChange={e => setFormEditar({...formEditar, estado: e.target.value})} required>
                      <option value="activo">Activo</option>
                      <option value="finalizado">Finalizado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field full-width">
                    <label>Actualizar Archivo Guía (Opcional)</label>
                    <input type="file" accept=".pdf,.doc,.docx" onChange={e => setFormEditar({...formEditar, archivo_guia: e.target.files[0]})} />
                    <p className="info-text">Si no subes ningún archivo, se conservará el anterior.</p>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">Guardar Cambios</button>
                <button type="button" className="btn-secondary" onClick={() => setModalEditar(false)}>Cancelar</button>
                <button type="button" className="btn-danger" onClick={handleEliminarSeminario}>Eliminar Seminario</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}