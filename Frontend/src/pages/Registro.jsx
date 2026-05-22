import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Registro.css';

// ── Utilidades de sanitización anti-inyección ────────────────────────────────
// Elimina cualquier carácter que no sea el tipo permitido antes de enviar al servidor
const sanitize = {
  texto: (v) => v.replace(/[<>"'`;\\]/g, ''),
  alfanumerico: (v) => v.replace(/[^A-Za-z0-9]/g, ''),
  numeros: (v) => v.replace(/\D/g, ''),
  letras: (v) => v.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑüÜ\s]/g, ''),
  alfanumEspacio: (v) => v.replace(/[^A-Za-z0-9\s]/g, ''),
};

export default function Registro() {
  const navigate = useNavigate();
  const [mensaje, setMensaje] = useState('');
  const [errores, setErrores] = useState({});

  const [formData, setFormData] = useState({
    rol: 'estudiante',
    nombre: '',
    email: '',
    documento: '',
    password: '',
    confirm_password: '',
    codigo_estudiante: '',
    opcion_grado: '',
    ciclo: '',
    telefono: '',
    nombre_proyecto: '',
    nombre_empresa: '',
    codigo_institucional: '',
    telefono_tutor: ''
  });

  // ── Regex helpers ────────────────────────────────────────────────────────────
  const soloLetras      = (v) => /^[A-Za-záéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(v);
  const soloAlfanum     = (v) => /^[A-Za-z0-9]+$/.test(v);
  const soloNumeros     = (v) => /^\d+$/.test(v);
  const alfanumEspacio  = (v) => /^[A-Za-z0-9\s]+$/.test(v);
  // Contraseña: letras y números, sin símbolos ni espacios
  const soloAlfanumPass = (v) => /^[A-Za-z0-9]+$/.test(v);

  // ── Validación por campo ─────────────────────────────────────────────────────
  const validarCampo = (name, value) => {
    let msg = '';

    switch (name) {
      case 'nombre':
        if (!value.trim())           { msg = 'El nombre completo es obligatorio.'; break; }
        if (!soloLetras(value))      { msg = 'El nombre solo puede contener letras (sin números ni símbolos).'; break; }
        if (value.trim().length > 50){ msg = 'El nombre no puede superar los 50 caracteres.'; break; }
        break;

      case 'email':
        if (!value.trim())                                    { msg = 'El correo institucional es obligatorio.'; break; }
        if (!value.toLowerCase().endsWith('@fet.edu.co'))     { msg = 'El correo debe terminar en @fet.edu.co.'; break; }
        break;

      case 'documento':
        if (!value.trim())           { msg = 'El número de documento es obligatorio.'; break; }
        if (!soloNumeros(value))     { msg = 'El documento solo puede contener números.'; break; }
        if (value.length > 10)       { msg = 'El documento no puede superar los 10 dígitos.'; break; }
        if (value.length < 5)        { msg = 'El documento debe tener al menos 5 dígitos.'; break; }
        break;

      case 'codigo_estudiante':
        if (!value.trim())           { msg = 'El código de estudiante es obligatorio.'; break; }
        if (!soloAlfanum(value))     { msg = 'El código solo puede contener letras y números (sin espacios ni símbolos).'; break; }
        if (value.length > 15)       { msg = 'El código no puede superar los 15 caracteres.'; break; }
        break;

      case 'codigo_institucional':
        if (!value.trim())           { msg = 'El código institucional es obligatorio.'; break; }
        if (!soloAlfanum(value))     { msg = 'El código solo puede contener letras y números (sin espacios ni símbolos).'; break; }
        if (value.length > 15)       { msg = 'El código no puede superar los 15 caracteres.'; break; }
        break;

      case 'nombre_proyecto':
        if (!value.trim())           { msg = 'El nombre del proyecto es obligatorio.'; break; }
        if (value.trim().length > 50){ msg = 'El nombre del proyecto no puede superar los 50 caracteres.'; break; }
        break;

      case 'nombre_empresa':
        if (!value.trim())             { msg = 'El nombre de la empresa es obligatorio.'; break; }
        if (!alfanumEspacio(value))    { msg = 'El nombre de empresa solo puede contener letras, números y espacios (sin símbolos).'; break; }
        if (value.trim().length > 50)  { msg = 'El nombre de la empresa no puede superar los 50 caracteres.'; break; }
        break;

      case 'password':
        if (!value)                      { msg = 'La contraseña es obligatoria.'; break; }
        if (!soloAlfanumPass(value))     { msg = 'La contraseña solo puede contener letras y números (sin símbolos ni espacios).'; break; }
        if (value.length > 30)           { msg = 'La contraseña no puede superar los 30 caracteres.'; break; }
        if (value.length < 6)            { msg = 'La contraseña debe tener al menos 6 caracteres.'; break; }
        break;

      case 'confirm_password':
        if (!value)                          { msg = 'Debes confirmar la contraseña.'; break; }
        if (value !== formData.password)     { msg = 'Las contraseñas no coinciden.'; break; }
        break;

      case 'telefono':
      case 'telefono_tutor':
        if (!value.trim())           { msg = 'El teléfono es obligatorio.'; break; }
        if (!soloNumeros(value))     { msg = 'El teléfono solo puede contener números.'; break; }
        if (value.length > 10)       { msg = 'El teléfono no puede superar los 10 dígitos.'; break; }
        if (value.length < 7)        { msg = 'El teléfono debe tener al menos 7 dígitos.'; break; }
        break;

      default:
        break;
    }

    setErrores(prev => ({ ...prev, [name]: msg }));
    return msg === '';
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;

    // NOMBRE: solo letras, máx 50, filtrado en tiempo real
    if (name === 'nombre') {
      const cleaned = sanitize.letras(value).slice(0, 50);
      setFormData(prev => ({ ...prev, [name]: cleaned }));
      validarCampo(name, cleaned);
      return;
    }

    // DOCUMENTO: solo números, máx 10
    if (name === 'documento') {
      const cleaned = sanitize.numeros(value).slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: cleaned }));
      validarCampo(name, cleaned);
      return;
    }

    // CONTRASEÑA: solo letras y números, máx 30
    if (name === 'password' || name === 'confirm_password') {
      const cleaned = sanitize.alfanumerico(value).slice(0, 30);
      setFormData(prev => ({ ...prev, [name]: cleaned }));
      validarCampo(name, cleaned);
      return;
    }

    // CÓDIGOS: solo alfanumérico, máx 15
    if (name === 'codigo_estudiante' || name === 'codigo_institucional') {
      const cleaned = sanitize.alfanumerico(value).slice(0, 15);
      setFormData(prev => ({ ...prev, [name]: cleaned }));
      validarCampo(name, cleaned);
      return;
    }

    // NOMBRE EMPRESA: solo letras, números y espacios, máx 50
    if (name === 'nombre_empresa') {
      const cleaned = sanitize.alfanumEspacio(value).slice(0, 50);
      setFormData(prev => ({ ...prev, [name]: cleaned }));
      validarCampo(name, cleaned);
      return;
    }

    // NOMBRE PROYECTO: máx 50, sin caracteres peligrosos
    if (name === 'nombre_proyecto') {
      const cleaned = sanitize.texto(value).slice(0, 50);
      setFormData(prev => ({ ...prev, [name]: cleaned }));
      validarCampo(name, cleaned);
      return;
    }

    // TELÉFONOS: solo números, máx 10
    if (name === 'telefono' || name === 'telefono_tutor') {
      const cleaned = sanitize.numeros(value).slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: cleaned }));
      validarCampo(name, cleaned);
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    validarCampo(name, value);
  };

  const handleBlur = (e) => {
    validarCampo(e.target.name, e.target.value);
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setErrores(prev => ({ ...prev, _server: '' }));

    const camposComunes = ['nombre', 'email', 'documento', 'password', 'confirm_password'];
    let todosValidos = true;

    camposComunes.forEach(campo => {
      if (!validarCampo(campo, formData[campo])) todosValidos = false;
    });

    if (formData.rol === 'estudiante') {
      if (!validarCampo('codigo_estudiante', formData.codigo_estudiante)) todosValidos = false;
      if (formData.opcion_grado === 'proyecto') {
        if (!validarCampo('nombre_proyecto', formData.nombre_proyecto)) todosValidos = false;
      }
      if (formData.opcion_grado === 'pasantia') {
        if (!validarCampo('nombre_empresa', formData.nombre_empresa)) todosValidos = false;
      }
      if (!validarCampo('telefono', formData.telefono)) todosValidos = false;
    }

    if (formData.rol === 'tutor') {
      if (!validarCampo('codigo_institucional', formData.codigo_institucional)) todosValidos = false;
      if (!validarCampo('telefono_tutor', formData.telefono_tutor)) todosValidos = false;
    }

    if (!todosValidos) return;

    // Sanitización final antes de enviar (segunda capa de protección)
    const payload = {
      ...formData,
      nombre:              sanitize.letras(formData.nombre).trim(),
      documento:           sanitize.numeros(formData.documento),
      password:            sanitize.alfanumerico(formData.password),
      codigo_estudiante:   sanitize.alfanumerico(formData.codigo_estudiante),
      codigo_institucional:sanitize.alfanumerico(formData.codigo_institucional),
      nombre_empresa:      sanitize.alfanumEspacio(formData.nombre_empresa).trim(),
      nombre_proyecto:     sanitize.texto(formData.nombre_proyecto).trim(),
      telefono:            sanitize.numeros(formData.telefono),
      telefono_tutor:      sanitize.numeros(formData.telefono_tutor),
    };
    // No enviamos confirm_password al servidor
    delete payload.confirm_password;

    try {
      await api.post('/registro', payload);
      setMensaje('¡Registro exitoso! Espera la aprobación del administrador.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      // Nunca mostrar detalles de BD al usuario
      const status = err.response?.status;
      let msgAmigable = 'Ocurrió un error inesperado. Intenta de nuevo más tarde.';
      if (status === 422) {
        // Errores de validación del servidor (campos duplicados, etc.)
        const serverErrors = err.response?.data?.errors;
        if (serverErrors) {
          // Tomar solo el primer mensaje amigable
          const primerError = Object.values(serverErrors).flat()[0];
          if (primerError?.includes('already been taken') || primerError?.includes('ya ha sido tomado')) {
            msgAmigable = 'El correo electrónico o código ya está registrado. Verifica tus datos.';
          } else if (primerError) {
            msgAmigable = primerError;
          }
        }
      } else if (status === 429) {
        msgAmigable = 'Demasiados intentos. Por favor espera un momento e intenta de nuevo.';
      }
      setErrores(prev => ({ ...prev, _server: msgAmigable }));
    }
  };

  // ── Renderizado de error de campo ─────────────────────────────────────────────
  const FieldError = ({ campo }) =>
    errores[campo] ? <small className="field-error">{errores[campo]}</small> : null;

  // ── JSX ───────────────────────────────────────────────────────────────────────
  return (
    <div className="registro-page">
      <div className="registro-container">
        <form onSubmit={handleSubmit} noValidate>
          <h2>Registro Missión FET</h2>

          {mensaje && <div className="mensaje">{mensaje}</div>}
          {errores._server && <div className="mensaje error">{errores._server}</div>}

          {/* ROL + NOMBRE */}
          <div className="form-row">
            <div className="registro-form-group">
              <label>Rol:</label>
              <select name="rol" value={formData.rol} onChange={handleChange} required>
                <option value="estudiante">Estudiante</option>
                <option value="tutor">Tutor</option>
              </select>
            </div>

            <div className="registro-form-group">
              <label>Nombre completo: <span className="hint-max">(solo letras, máx. 50)</span></label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={50}
                placeholder="Solo letras, máx. 50 caracteres"
                required
              />
              <FieldError campo="nombre" />
            </div>
          </div>

          {/* EMAIL + DOCUMENTO */}
          <div className="form-row">
            <div className="registro-form-group">
              <label>Correo institucional:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="ejemplo@fet.edu.co"
                required
              />
              <small className="email-hint">El correo debe terminar en @fet.edu.co</small>
              <FieldError campo="email" />
            </div>
            <div className="registro-form-group">
              <label>Número de documento: <span className="hint-max">(máx. 10 dígitos)</span></label>
              <input
                type="text"
                inputMode="numeric"
                name="documento"
                value={formData.documento}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={10}
                placeholder="Solo números, máx. 10"
                required
              />
              <FieldError campo="documento" />
            </div>
          </div>

          {/* === CAMPOS DINÁMICOS: ESTUDIANTE === */}
          {formData.rol === 'estudiante' && (
            <>
              <div className="form-row">
                <div className="registro-form-group">
                  <label>Código de estudiante: <span className="hint-max">(máx. 15 caracteres)</span></label>
                  <input
                    type="text"
                    name="codigo_estudiante"
                    value={formData.codigo_estudiante}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={15}
                    placeholder="Solo letras y números"
                    required
                  />
                  <FieldError campo="codigo_estudiante" />
                </div>
                <div className="registro-form-group">
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
                  <div className="registro-form-group">
                    <label>Nombre del proyecto: <span className="hint-max">(máx. 50 caracteres)</span></label>
                    <input
                      type="text"
                      name="nombre_proyecto"
                      value={formData.nombre_proyecto}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      maxLength={50}
                      placeholder="Máx. 50 caracteres"
                      required
                    />
                    <FieldError campo="nombre_proyecto" />
                  </div>
                </div>
              )}

              {formData.opcion_grado === 'pasantia' && (
                <div className="form-row">
                  <div className="registro-form-group">
                    <label>Nombre de la empresa: <span className="hint-max">(letras y números, máx. 50)</span></label>
                    <input
                      type="text"
                      name="nombre_empresa"
                      value={formData.nombre_empresa}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      maxLength={50}
                      placeholder="Solo letras y números"
                      required
                    />
                    <FieldError campo="nombre_empresa" />
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="registro-form-group">
                  <label>Ciclo:</label>
                  <select name="ciclo" value={formData.ciclo} onChange={handleChange} required>
                    <option value="">Seleccione un ciclo</option>
                    <option value="tecnico">Técnico</option>
                    <option value="tecnologo">Tecnólogo</option>
                    <option value="profesional">Profesional</option>
                  </select>
                </div>
                <div className="registro-form-group">
                  <label>Teléfono: <span className="hint-max">(máx. 10 dígitos)</span></label>
                  <input
                    type="text"
                    inputMode="numeric"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={10}
                    placeholder="Solo números, máx. 10"
                    required
                  />
                  <FieldError campo="telefono" />
                </div>
              </div>
            </>
          )}

          {/* === CAMPOS DINÁMICOS: TUTOR === */}
          {formData.rol === 'tutor' && (
            <div className="form-row">
              <div className="registro-form-group">
                <label>Código institucional: <span className="hint-max">(máx. 15 caracteres)</span></label>
                <input
                  type="text"
                  name="codigo_institucional"
                  value={formData.codigo_institucional}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={15}
                  placeholder="Solo letras y números"
                  required
                />
                <FieldError campo="codigo_institucional" />
              </div>
              <div className="registro-form-group">
                <label>Teléfono Tutor: <span className="hint-max">(máx. 10 dígitos)</span></label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="telefono_tutor"
                  value={formData.telefono_tutor}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={10}
                  placeholder="Solo números, máx. 10"
                  required
                />
                <FieldError campo="telefono_tutor" />
              </div>
            </div>
          )}

          {/* CONTRASEÑAS */}
          <div className="form-row">
            <div className="registro-form-group">
              <label>Contraseña: <span className="hint-max">(letras y números, máx. 30)</span></label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={30}
                placeholder="Letras y números, mín. 6"
                required
              />
              <FieldError campo="password" />
            </div>
            <div className="registro-form-group">
              <label>Confirmar contraseña:</label>
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={30}
                placeholder="Repite tu contraseña"
                required
              />
              <FieldError campo="confirm_password" />
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