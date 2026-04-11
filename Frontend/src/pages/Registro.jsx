import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Registro.css';

export default function Registro() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  
  // Estado inicial del formulario
  const [formData, setFormData] = useState({
    rol: 'estudiante',
    nombre: '',
    email: '',
    documento: '',
    password: '',
    confirm_password: '',
    // Campos Estudiante
    codigo_estudiante: '',
    opcion_grado: '',
    ciclo: '',
    telefono: '',
    nombre_proyecto: '',
    nombre_empresa: '',
    // Campos Tutor
    codigo_institucional: '',
    telefono_tutor: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    // Validaciones Front-end
    if (formData.password !== formData.confirm_password) {
      return setError('Las contraseñas no coinciden');
    }
    if (!formData.email.toLowerCase().endsWith('@fet.edu.co')) {
      return setError('El correo debe ser institucional (@fet.edu.co)');
    }

    try {
      // Enviamos los datos a Laravel (A futuro crearemos esta ruta en el backend)
      const response = await api.post('/registro', formData);
      setMensaje('Registro exitoso. Espera la aprobación del administrador.');
      
      // Opcional: Redirigir al login después de 3 segundos
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar el usuario');
    }
  };

  return (
    <div className="registro-page">
      <div className="registro-container">
        <form onSubmit={handleSubmit}>
          <h2>Registro Missión FET</h2>

          {mensaje && <div className="mensaje">{mensaje}</div>}
          {error && <div className="mensaje error">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label>Rol:</label>
              <select name="rol" value={formData.rol} onChange={handleChange} required>
                <option value="estudiante">Estudiante</option>
                <option value="tutor">Tutor</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Nombre completo:</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Correo institucional:</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="ejemplo@fet.edu.co" required />
              <small className="email-hint">El correo debe terminar en @fet.edu.co</small>
            </div>
            <div className="form-group">
              <label>Número de documento:</label>
              <input type="number" name="documento" value={formData.documento} onChange={handleChange} required />
            </div>
          </div>

          {/* === CAMPOS DINÁMICOS: ESTUDIANTE === */}
          {formData.rol === 'estudiante' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Código de estudiante:</label>
                  <input type="text" name="codigo_estudiante" value={formData.codigo_estudiante} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Opción de grado:</label>
                  <select name="opcion_grado" value={formData.opcion_grado} onChange={handleChange} required>
                    <option value="">Seleccione una opción</option>
                    <option value="seminario">Seminario</option>
                    <option value="proyecto">Proyecto de Aplicación</option>
                    <option value="pasantia">Pasantías</option>
                  </select>
                </div>
              </div>

              {formData.opcion_grado === 'proyecto' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre del proyecto:</label>
                    <input type="text" name="nombre_proyecto" value={formData.nombre_proyecto} onChange={handleChange} required />
                  </div>
                </div>
              )}

              {formData.opcion_grado === 'pasantia' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre de la empresa:</label>
                    <input type="text" name="nombre_empresa" value={formData.nombre_empresa} onChange={handleChange} required />
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Ciclo:</label>
                  <select name="ciclo" value={formData.ciclo} onChange={handleChange} required>
                    <option value="">Seleccione un ciclo</option>
                    <option value="tecnico">Técnico</option>
                    <option value="tecnologo">Tecnólogo</option>
                    <option value="profesional">Profesional</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Teléfono:</label>
                  <input type="number" name="telefono" value={formData.telefono} onChange={handleChange} required />
                </div>
              </div>
            </>
          )}

          {/* === CAMPOS DINÁMICOS: TUTOR === */}
          {formData.rol === 'tutor' && (
            <div className="form-row">
              <div className="form-group">
                <label>Código institucional:</label>
                <input type="text" name="codigo_institucional" value={formData.codigo_institucional} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Teléfono Tutor:</label>
                <input type="number" name="telefono_tutor" value={formData.telefono_tutor} onChange={handleChange} required />
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Contraseña:</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Confirmar contraseña:</label>
              <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} required />
            </div>
          </div>
          
          <div className="form-terms">
            <input type="checkbox" id="terms" required />
            <label htmlFor="terms">Acepto los términos y condiciones</label>
          </div>

          <button type="submit" className="btn-registro">Registrarse</button>
          
          <p className="login-link">
            ¿Ya tienes cuenta? <button type="button" onClick={() => navigate('/login')}>Iniciar sesión</button>
          </p>
        </form>
      </div>
    </div>
  );
}