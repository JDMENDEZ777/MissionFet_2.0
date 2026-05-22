import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
 import './GestionUsuarios.css'; // 

// ── Utilidades de sanitización anti-inyección ────────────────────────────────
const sanitize = {
  email: (v) => v.replace(/[<>"'`;\\]/g, ''),
  alfanumerico: (v) => v.replace(/[^A-Za-z0-9]/g, ''),
  numeros: (v) => v.replace(/\D/g, ''),
  letras: (v) => v.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑüÜ\s]/g, ''),
};

export default function GestionUsuarios() {
  const navigate = useNavigate();
  const [navActive, setNavActive] = useState(false);
  
  // Estados de datos
  const [usuarios, setUsuarios] = useState([]);
  const [mensaje, setMensaje] = useState({ text: '', type: '' });
  
  // Estados para Filtros
  const [filtros, setFiltros] = useState({
    search: '', estado: '', rol: '', opcion_grado: '', ciclo: ''
  });

  // Estados para Modales
  const [modalEdit, setModalEdit] = useState(false);
  const [modalDelete, setModalDelete] = useState(false);
  const [userActivo, setUserActivo] = useState(null); // Usuario seleccionado para editar/eliminar
  
  // Estado para el formulario de edición
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await api.get('/admin/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      mostrarMensaje('Error al cargar los usuarios', 'error');
    }
  };

  const mostrarMensaje = (text, type) => {
    setMensaje({ text, type });
    setTimeout(() => setMensaje({ text: '', type: '' }), 5000);
  };

  // --- LÓGICA DE FILTRADO EN TIEMPO REAL ---
  const usuariosFiltrados = usuarios.filter(u => {
    const term = filtros.search.toLowerCase();
    const matchSearch = u.nombre?.toLowerCase().includes(term) || 
                        u.documento?.includes(term) || 
                        u.email?.toLowerCase().includes(term);
                        
    const matchEstado = filtros.estado ? u.estado === filtros.estado : true;
    const matchRol = filtros.rol ? u.rol === filtros.rol : true;
    const matchOpcion = filtros.opcion_grado ? u.opcion_grado === filtros.opcion_grado : true;
    const matchCiclo = filtros.ciclo ? u.ciclo === filtros.ciclo : true;

    return matchSearch && matchEstado && matchRol && matchOpcion && matchCiclo;
  });

  // --- ACCIONES MODALES ---
  // --- ACCIONES MODALES ---
  const abrirEdit = (usuario) => {
    setUserActivo(usuario);
    // Llenamos el formulario protegiendo los valores nulos con comillas vacías ''
    setEditForm({
      ...usuario,
      ciclo: usuario.ciclo || '',
      opcion_grado: usuario.opcion_grado || '',
      telefono: usuario.telefono || ''
    });
    setModalEdit(true);
  };

  const abrirDelete = (usuario) => {
    setUserActivo(usuario);
    setModalDelete(true);
  };

  // --- PETICIONES AL BACKEND ---
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    // Sanitización final antes de enviar (capa de seguridad extra)
    const payload = {
      ...editForm,
      name:              editForm.name ? sanitize.letras(editForm.name).trim().slice(0, 50) : '',
      nombre:            editForm.nombre ? sanitize.letras(editForm.nombre).trim().slice(0, 50) : '',
      email:             editForm.email ? sanitize.email(editForm.email).trim() : '',
      documento:         editForm.documento ? sanitize.numeros(editForm.documento).slice(0, 10) : '',
      codigo_estudiante: editForm.codigo_estudiante ? sanitize.alfanumerico(editForm.codigo_estudiante).slice(0, 15) : '',
      telefono:          editForm.telefono ? sanitize.numeros(editForm.telefono).slice(0, 10) : '',
    };

    try {
      await api.put(`/admin/usuarios/${userActivo.id}`, payload);
      mostrarMensaje('Usuario actualizado correctamente', 'exito');
      setModalEdit(false);
      fetchUsuarios(); // Recargamos la tabla
    } catch (error) {
      const status = error.response?.status;
      let msgAmigable = 'Error al actualizar el usuario. Intente de nuevo más tarde.';
      if (status === 422) {
        const serverErrors = error.response?.data?.errors;
        if (serverErrors) {
          const primerError = Object.values(serverErrors).flat()[0];
          if (primerError?.includes('already been taken') || primerError?.includes('ya ha sido tomado')) {
            msgAmigable = 'El correo electrónico, documento o código ya está registrado.';
          } else if (primerError) {
            msgAmigable = primerError;
          }
        }
      }
      mostrarMensaje(msgAmigable, 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/usuarios/${userActivo.id}`);
      mostrarMensaje('Usuario eliminado correctamente', 'exito');
      setModalDelete(false);
      fetchUsuarios();
    } catch (error) {
      mostrarMensaje('Error al eliminar. Verifica que no tenga proyectos relacionados.', 'error');
      setModalDelete(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className={`admin-layout ${navActive ? 'nav-active' : ''}`}>
      
      {/* HEADER / NAVBAR */}
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
            <li><Link to="/usuarios" className="active">Gestión de Usuarios</Link></li>
            <li className="dropdown">
              <a href="#">Gestión de Modalidades de Grado</a>
              <ul className="dropdown-content">
                <li><Link to="/seminarios">Seminario</Link></li>
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
        <h1>Gestión de Usuarios</h1>

        {mensaje.text && (
          <div className={`mensaje ${mensaje.type}`}>
            {mensaje.text}
          </div>
        )}

        {/* SECCIÓN DE FILTROS */}
                <div className="filters-section">
                <div className="search-bar">
                <input 
            type="text" 
            placeholder="Buscar por nombre, documento o email..."
            value={filtros.search}
            onChange={(e) => setFiltros({...filtros, search: e.target.value})}
            />
            
        </div>

          <div className="filters">
            <div className="filter">
              <label>Estado:</label>
              <select value={filtros.estado} onChange={(e) => setFiltros({...filtros, estado: e.target.value})}>
                <option value="">Todos</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>

            <div className="filter">
              <label>Rol:</label>
              <select value={filtros.rol} onChange={(e) => setFiltros({...filtros, rol: e.target.value})}>
                <option value="">Todos</option>
                <option value="estudiante">Estudiante</option>
                <option value="tutor">Tutor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="filter">
              <label>Opción Grado:</label>
              <select value={filtros.opcion_grado} onChange={(e) => setFiltros({...filtros, opcion_grado: e.target.value})}>
                <option value="">Todas</option>
                <option value="seminario">Seminario</option>
                <option value="proyecto">Proyecto de Grado</option>
                <option value="pasantia">Pasantía</option>
              </select>
            </div>

            <div className="filter">
              <label>Ciclo:</label>
              <select value={filtros.ciclo} onChange={(e) => setFiltros({...filtros, ciclo: e.target.value})}>
                <option value="">Todos</option>
                <option value="tecnico">Técnico</option>
                <option value="tecnologo">Tecnólogo</option>
                <option value="profesional">Profesional</option>
              </select>
            </div>
            {/* BOTÓN APLICAR (Vuelve a la vida) */}
            <button type="button" className="apply-filters">
                Aplicar
            </button>

            {/* BOTÓN LIMPIAR (Con su clase original) */}
            <button 
                type="button" 
                onClick={() => setFiltros({search: '', estado: '', rol: '', opcion_grado: '', ciclo: ''})} 
                className="clear-filters">
                     Limpiar
            </button>
          </div>
        </div>

        {/* TABLA DE USUARIOS */}
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Documento</th>
                <th>Código</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Opción Grado</th>
                <th>Ciclo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr><td colSpan="10" style={{textAlign: 'center'}}>No se encontraron usuarios.</td></tr>
              ) : (
                usuariosFiltrados.map(usuario => (
                  <tr key={usuario.id}>
                    <td>{usuario.nombre || usuario.name}</td>
                    <td style={{ textTransform: 'capitalize' }}>
                      {usuario.rol === 'admin' ? 'Administrador' : usuario.rol}
                    </td>
                    <td>{usuario.documento}</td>
                    <td>{usuario.codigo_estudiante || 'N/A'}</td>
                    <td>{usuario.email}</td>
                    <td>{usuario.telefono || 'N/A'}</td>
                    <td style={{ textTransform: 'capitalize' }}>
                      {usuario.opcion_grado === 'pasantia' ? 'Pasantía' : (usuario.opcion_grado || 'N/A')}
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>
                      {usuario.ciclo === 'tecnico' ? 'Técnico' : 
                      usuario.ciclo === 'tecnologo' ? 'Tecnólogo' : 
                      (usuario.ciclo || 'N/A')}
                    </td>
                    <td>
                    <td style={{ textTransform: 'capitalize' }}>
                      <span className={`status ${usuario.estado || 'activo'}`}>
                        {usuario.estado || 'Activo'}
                      </span>
                  </td>
                    </td>
                    <td className="actions">
                      <button className="edit" onClick={() => abrirEdit(usuario)}>🖊</button>
                      <button className="delete" onClick={() => abrirDelete(usuario)}>🗑</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL DE EDICIÓN */}
        {modalEdit && (
          <div className="modal" style={{display: 'block'}}>
            <div className="modal-content">
              <span className="close" onClick={() => setModalEdit(false)}>&times;</span>
              <h2>Editar Usuario</h2>
              <form onSubmit={handleUpdate}>
                
                <div className="form-group">
                  <label>Nombre:</label>
                  {/* Nota: Usamos name o nombre dependiendo de cómo esté en BD */}
                  <input 
                    type="text" 
                    value={editForm.name || editForm.nombre || ''} 
                    onChange={(e) => {
                      const cleaned = sanitize.letras(e.target.value).slice(0, 50);
                      setEditForm({ ...editForm, name: cleaned, nombre: cleaned });
                    }} 
                    maxLength={50}
                    placeholder="Solo letras, máx. 50"
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Email:</label>
                  <input 
                    type="email" 
                    value={editForm.email || ''} 
                    onChange={(e) => {
                      const cleaned = sanitize.email(e.target.value);
                      setEditForm({ ...editForm, email: cleaned });
                    }} 
                    placeholder="ejemplo@fet.edu.co"
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Rol:</label>
                  <select value={editForm.rol || ''} onChange={(e) => setEditForm({...editForm, rol: e.target.value})} required>
                    <option value="estudiante">Estudiante</option>
                    <option value="tutor">Tutor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Documento:</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={editForm.documento || ''} 
                    onChange={(e) => {
                      const cleaned = sanitize.numeros(e.target.value).slice(0, 10);
                      setEditForm({ ...editForm, documento: cleaned });
                    }} 
                    maxLength={10}
                    placeholder="Solo números, máx. 10"
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Código:</label>
                  <input 
                    type="text" 
                    value={editForm.codigo_estudiante || ''} 
                    onChange={(e) => {
                      const cleaned = sanitize.alfanumerico(e.target.value).slice(0, 15);
                      setEditForm({ ...editForm, codigo_estudiante: cleaned });
                    }} 
                    maxLength={15}
                    placeholder="Letras y números, máx. 15"
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono:</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={editForm.telefono || ''} 
                    onChange={(e) => {
                      const cleaned = sanitize.numeros(e.target.value).slice(0, 10);
                      setEditForm({ ...editForm, telefono: cleaned });
                    }} 
                    maxLength={10}
                    placeholder="Solo números, máx. 10"
                  />
                </div>

                <div className="form-group">
                  <label>Opción Grado:</label>
                  <select value={editForm.opcion_grado || ''} onChange={(e) => setEditForm({...editForm, opcion_grado: e.target.value})}>
                    <option value="">Ninguna</option>
                    <option value="seminario">Seminario</option>
                    <option value="proyecto">Proyecto</option>
                    <option value="pasantia">Pasantia</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Ciclo:</label>
                  <select value={editForm.ciclo || ''} onChange={(e) => setEditForm({...editForm, ciclo: e.target.value})}>
                    <option value="">Ninguno</option>
                    <option value="tecnico">Técnico</option>
                    <option value="tecnologo">Tecnólogo</option>
                    <option value="profesional">Profesional</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Estado:</label>
                  <select value={editForm.estado || 'activo'} onChange={(e) => setEditForm({...editForm, estado: e.target.value})} required>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button type="submit">Guardar</button>
                  <button type="button" className="cancel" onClick={() => setModalEdit(false)}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DE ELIMINAR */}
        {modalDelete && (
          <div className="modal" style={{display: 'block'}}>
            <div className="modal-content">
              <span className="close" onClick={() => setModalDelete(false)}>&times;</span>
              <h2>Confirmar Eliminación</h2>
              <p>¿Está seguro de eliminar al usuario <strong>{userActivo?.name || userActivo?.nombre}</strong>?</p>
              <div className="form-actions">
                <button type="button" onClick={handleDelete} style={{background: '#DC2626'}}>Eliminar</button>
                <button type="button" className="cancel" onClick={() => setModalDelete(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}