import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios'; 
import './GestionProyectos.css';

const GestionProyectos = () => {
  const navigate = useNavigate();
  const [navActive, setNavActive] = useState(false);
  const [activeTab, setActiveTab] = useState('crear');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  
  const [proyectos, setProyectos] = useState([]);
  const [tutores, setTutores] = useState([]);
  const [estudiantesDisponibles, setEstudiantesDisponibles] = useState([]);
  const [searchEstudiante, setSearchEstudiante] = useState('');

  const [formCrear, setFormCrear] = useState({
    titulo: '',
    descripcion: '',
    tutor_id: '',
    archivo_proyecto: null,
    estudiantesSeleccionados: [] 
  });

  useEffect(() => {
    fetchDatosIniciales();
  }, []);

  const fetchDatosIniciales = async () => {
    try {
      const [resForm, resProyectos] = await Promise.all([
        api.get('/admin/proyectos/form-data'),
        api.get('/admin/proyectos')
      ]);
      setTutores(resForm.data.tutores);
      setEstudiantesDisponibles(resForm.data.estudiantes);
      setProyectos(resProyectos.data);
    } catch (error) {
      mostrarMensaje('Error al cargar datos del servidor', 'error');
    }
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    window.scrollTo(0, 0);
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 5000);
  };

  const handleEstudianteToggle = (id) => {
    setFormCrear(prev => {
      const yaSeleccionado = prev.estudiantesSeleccionados.includes(id);
      if (yaSeleccionado) {
        return { ...prev, estudiantesSeleccionados: prev.estudiantesSeleccionados.filter(estId => estId !== id) };
      } else {
        if (prev.estudiantesSeleccionados.length >= 3) {
          alert('Máximo 3 estudiantes por proyecto.');
          return prev;
        }
        return { ...prev, estudiantesSeleccionados: [...prev.estudiantesSeleccionados, id] };
      }
    });
  };

  const handleSubmitCrear = async (e) => {
    e.preventDefault();
    if (formCrear.estudiantesSeleccionados.length === 0) {
      alert('Debes seleccionar al menos un estudiante.');
      return;
    }

    const formData = new FormData();
    formData.append('titulo', formCrear.titulo);
    formData.append('descripcion', formCrear.descripcion);
    formData.append('tutor_id', formCrear.tutor_id);
    if (formCrear.archivo_proyecto) formData.append('archivo_proyecto', formCrear.archivo_proyecto);
    formData.append('estudiantes', JSON.stringify(formCrear.estudiantesSeleccionados));

    try {
      await api.post('/admin/proyectos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      mostrarMensaje('Proyecto creado y estudiantes asignados', 'exito');
      setFormCrear({ titulo: '', descripcion: '', tutor_id: '', archivo_proyecto: null, estudiantesSeleccionados: [] });
      fetchDatosIniciales();
      setActiveTab('listar'); 
    } catch (error) {
      mostrarMensaje('Error al crear el proyecto', 'error');
    }
  };

  const estudiantesFiltrados = estudiantesDisponibles.filter(est => 
    est.nombre.toLowerCase().includes(searchEstudiante.toLowerCase())
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
              <a href="#">Gestión de Modalidades</a>
              <ul className="dropdown-content" style={{display: 'block'}}>
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

      <main className={navActive ? 'nav-active' : ''}>
        <h1>Gestión de Proyectos</h1>

        {mensaje.texto && <div className={`mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>}

        <div className="tabs">
          <button className={activeTab === 'crear' ? 'active' : ''} onClick={() => setActiveTab('crear')}>Crear Proyecto</button>
          <button className={activeTab === 'listar' ? 'active' : ''} onClick={() => setActiveTab('listar')}>Listar Proyectos</button>
        </div>

        {activeTab === 'crear' && (
          <section className="tab-content active">
            <form onSubmit={handleSubmitCrear}>
              <div className="form-group">
                <h2>Información del Proyecto</h2>
                <div className="form-row">
                  <div className="form-field full-width">
                    <label>Título del Proyecto *</label>
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
                    <label>Tutor Asignado *</label>
                    <select value={formCrear.tutor_id} onChange={e => setFormCrear({...formCrear, tutor_id: e.target.value})} required>
                      <option value="">-- Seleccione un tutor --</option>
                      {tutores.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Archivo del Proyecto (PDF, DOC)</label>
                    <input type="file" onChange={e => setFormCrear({...formCrear, archivo_proyecto: e.target.files[0]})} />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <h2>Asignación de Estudiantes (Máx 3)</h2>
                <div className="search-filter">
                  <input type="text" placeholder="Buscar estudiantes..." value={searchEstudiante} onChange={e => setSearchEstudiante(e.target.value)} />
                </div>
                <div className="estudiantes-container">
                  {estudiantesFiltrados.map(est => (
                    <div className={`estudiante-card ${formCrear.estudiantesSeleccionados.includes(est.id) ? 'selected' : ''}`} key={est.id}>
                      <div className="estudiante-info">
                        <h3>{est.nombre}</h3>
                        <p>Código: {est.codigo_estudiante || 'N/A'}</p>
                      </div>
                      <div className="estudiante-select">
                        <input type="checkbox" checked={formCrear.estudiantesSeleccionados.includes(est.id)} onChange={() => handleEstudianteToggle(est.id)} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="estudiantes-seleccionados">
                  <h3>Seleccionados: {formCrear.estudiantesSeleccionados.length}/3</h3>
                  <ul>
                    {formCrear.estudiantesSeleccionados.map((id, index) => {
                      const est = estudiantesDisponibles.find(e => e.id === id);
                      return <li key={id}>{index === 0 && <span className="lider-badge">Líder 👑</span>} {est?.nombre}</li>
                    })}
                  </ul>
                </div>
              </div>
              <button type="submit" className="btn-primary">Crear Proyecto</button>
            </form>
          </section>
        )}

        {activeTab === 'listar' && (
          <section className="tab-content active">
            <div className="proyectos-grid">
              {proyectos.map(p => (
                <div className="proyecto-card" key={p.id}>
                  <div className={`proyecto-header estado-${p.estado}`}>
                    <h3>{p.titulo}</h3>
                    <span>{p.estado?.replace('_', ' ')}</span>
                  </div>
                  <div className="proyecto-body">
                    <p><strong>Estudiantes:</strong> {p.num_estudiantes}/3</p>
                    <p><strong>Tutor:</strong> {p.tutor_nombre || 'Pendiente'}</p>
                    {p.archivo_proyecto && (
                        <p><strong>Archivo:</strong> <a href={`http://localhost:8000/storage/proyectos/${p.archivo_proyecto}`} target="_blank" rel="noreferrer">Ver archivo</a></p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default GestionProyectos;