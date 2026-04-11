import React, { useState, useEffect } from 'react';
import api from '../../api/axios'; // Ajusta la ruta de tu axios si es diferente
import './GestionProyectos.css';

const GestionProyectos = () => {
  const [activeTab, setActiveTab] = useState('crear');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  
  // Datos traídos del backend
  const [proyectos, setProyectos] = useState([]);
  const [tutores, setTutores] = useState([]);
  const [estudiantesDisponibles, setEstudiantesDisponibles] = useState([]);
  
  // Filtros de búsqueda
  const [searchEstudiante, setSearchEstudiante] = useState('');

  // Formulario de creación
  const [formCrear, setFormCrear] = useState({
    titulo: '',
    descripcion: '',
    tutor_id: '',
    archivo_proyecto: null,
    estudiantesSeleccionados: [] // Guardaremos los IDs aquí
  });

  // Cargar datos iniciales
  useEffect(() => {
    fetchDatosIniciales();
  }, []);

  const fetchDatosIniciales = async () => {
    try {
      // Traemos tutores y estudiantes libres
      const resForm = await api.get('/admin/proyectos/form-data');
      setTutores(resForm.data.tutores);
      setEstudiantesDisponibles(resForm.data.estudiantes);

      // Traemos la lista de proyectos
      const resProyectos = await api.get('/admin/proyectos');
      setProyectos(resProyectos.data);
    } catch (error) {
      mostrarMensaje('Error al cargar los datos del servidor', 'error');
    }
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 5000);
  };

  // Lógica para seleccionar máximo 3 estudiantes
  const handleEstudianteToggle = (id) => {
    setFormCrear(prev => {
      const yaSeleccionado = prev.estudiantesSeleccionados.includes(id);
      
      if (yaSeleccionado) {
        // Si ya estaba, lo quitamos
        return { ...prev, estudiantesSeleccionados: prev.estudiantesSeleccionados.filter(estId => estId !== id) };
      } else {
        // Si no estaba, verificamos que no pase de 3
        if (prev.estudiantesSeleccionados.length >= 3) {
          alert('No puedes seleccionar más de 3 estudiantes para un proyecto.');
          return prev;
        }
        return { ...prev, estudiantesSeleccionados: [...prev.estudiantesSeleccionados, id] };
      }
    });
  };

  // Crear el proyecto
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
    
    if (formCrear.archivo_proyecto) {
      formData.append('archivo_proyecto', formCrear.archivo_proyecto);
    }
    
    // Convertimos el array a texto (JSON) para que Laravel lo entienda
    formData.append('estudiantes', JSON.stringify(formCrear.estudiantesSeleccionados));

    try {
      await api.post('/admin/proyectos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      mostrarMensaje('Proyecto creado y estudiantes asignados exitosamente', 'exito');
      
      // Limpiamos el formulario
      setFormCrear({
        titulo: '', descripcion: '', tutor_id: '', archivo_proyecto: null, estudiantesSeleccionados: []
      });
      
      // Recargamos los datos para actualizar las tablas
      fetchDatosIniciales();
      setActiveTab('listar'); // Pasamos a la pestaña de listar automáticamente

    } catch (error) {
      mostrarMensaje('Error al crear el proyecto', 'error');
    }
  };

  // Filtrar estudiantes en pantalla según el buscador
  const estudiantesFiltrados = estudiantesDisponibles.filter(est => 
    est.nombre.toLowerCase().includes(searchEstudiante.toLowerCase())
  );

  return (
    <div className="admin-layout">

        {/* --- AGREGAR ESTO: BARRA DE NAVEGACIÓN --- */}
      <nav id="navbar" className="active">
        <div className="nav-header">
          <img src="/IMG/logofet.png" alt="Logo FET" className="logo-img" />
        </div>
        <ul>
          <li><a href="/dashboard">Inicio</a></li>
          <li><a href="/aprobacion">Aprobación de Usuarios</a></li>
          <li><a href="/usuarios">Gestión de Usuarios</a></li>
          <li className="dropdown">
            <a href="#">Gestión de Modalidades</a>
            <ul className="dropdown-content">
              <li><a href="/seminarios">Seminario</a></li>
              <li><a href="/proyectos" className="active">Proyectos</a></li>
              <li><a href="/pasantias">Pasantías</a></li>
            </ul>
          </li>
          <li><a href="/login">Cerrar Sesión</a></li>
        </ul>
      </nav>

      <main>
        <h1>Gestión de Proyectos</h1>

        {mensaje.texto && (
          <div className={`mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>
        )}

        <div className="tabs">
          <button className={activeTab === 'crear' ? 'active' : ''} onClick={() => setActiveTab('crear')}>
            Crear Proyecto
          </button>
          <button className={activeTab === 'listar' ? 'active' : ''} onClick={() => setActiveTab('listar')}>
            Listar Proyectos
          </button>
        </div>

        {/* --- PESTAÑA CREAR --- */}
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
                    <label>Descripción del Proyecto *</label>
                    <textarea rows="4" value={formCrear.descripcion} onChange={e => setFormCrear({...formCrear, descripcion: e.target.value})} required></textarea>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Tutor Asignado *</label>
                    <select value={formCrear.tutor_id} onChange={e => setFormCrear({...formCrear, tutor_id: e.target.value})} required>
                      <option value="">-- Seleccione un tutor --</option>
                      {tutores.map(tutor => (
                        <option key={tutor.id} value={tutor.id}>{tutor.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Archivo del Proyecto (PDF, DOC)</label>
                    <input type="file" accept=".pdf,.doc,.docx" onChange={e => setFormCrear({...formCrear, archivo_proyecto: e.target.files[0]})} />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <h2>Asignación de Estudiantes</h2>
                <p className="info-text">Seleccione de 1 a 3 estudiantes para el proyecto. El primer seleccionado será el líder.</p>
                
                <div className="search-filter">
                  <input type="text" placeholder="Buscar estudiantes libres..." value={searchEstudiante} onChange={e => setSearchEstudiante(e.target.value)} />
                </div>

                <div className="estudiantes-container">
                  {estudiantesFiltrados.length > 0 ? (
                    estudiantesFiltrados.map(est => (
                      <div className="estudiante-card" key={est.id}>
                        <div className="estudiante-info">
                          <h3>{est.nombre}</h3>
                          <p><strong>Código:</strong> {est.codigo_estudiante || 'N/A'}</p>
                          <p><strong>Email:</strong> {est.email}</p>
                        </div>
                        <div className="estudiante-select">
                          <input 
                            type="checkbox" 
                            checked={formCrear.estudiantesSeleccionados.includes(est.id)}
                            onChange={() => handleEstudianteToggle(est.id)} 
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{textAlign: 'center', width: '100%'}}>No hay estudiantes disponibles que cumplan los requisitos.</p>
                  )}
                </div>

                <div className="estudiantes-seleccionados">
                  <h3>Estudiantes Seleccionados: <span>{formCrear.estudiantesSeleccionados.length}/3</span></h3>
                  <ul>
                    {formCrear.estudiantesSeleccionados.map((id, index) => {
                      const est = estudiantesDisponibles.find(e => e.id === id);
                      return <li key={id}>{index === 0 ? '👑 ' : ''}{est?.nombre} {index === 0 ? '(Líder)' : ''}</li>
                    })}
                  </ul>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">Crear Proyecto</button>
              </div>
            </form>
          </section>
        )}

        {/* --- PESTAÑA LISTAR --- */}
        {activeTab === 'listar' && (
          <section className="tab-content active">
            <div className="proyectos-grid">
              {proyectos.length > 0 ? (
                proyectos.map(proyecto => (
                  <div className="proyecto-card" key={proyecto.id}>
                    <div className={`proyecto-header estado-${proyecto.estado}`}>
                      <h3>{proyecto.titulo}</h3>
                      <span className="proyecto-estado">{proyecto.estado.replace('_', ' ')}</span>
                    </div>
                    <div className="proyecto-body">
                      <p><strong>Estudiantes:</strong> {proyecto.num_estudiantes}/3</p>
                      <p><strong>Tutor:</strong> {proyecto.tutor_nombre || 'No asignado'}</p>
                      <p><strong>ID:</strong> {proyecto.id}</p>
                      {proyecto.archivo_proyecto && (
                         <p><strong>Archivo:</strong> <a href={`http://localhost:8000/storage/proyectos/${proyecto.archivo_proyecto}`} target="_blank" rel="noreferrer">Ver archivo</a></p>
                      )}
                    </div>
                    <div className="proyecto-footer">
                      <button className="btn-ver">Ver Detalles</button> {/* Lo conectaremos luego */}
                      <button className="btn-editar">Editar</button> {/* Lo conectaremos luego */}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-proyectos">
                  <p>No hay proyectos registrados.</p>
                </div>
              )}
            </div>
          </section>
        )}

      </main>
    </div>
  );
};

export default GestionProyectos;