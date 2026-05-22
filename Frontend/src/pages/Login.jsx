import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

// 1. IMPORTAMOS TU NUEVO CSS
import './Login.css'; 

// ── Utilidades de sanitización anti-inyección ────────────────────────────────
const sanitize = {
  email: (v) => v.replace(/[<>"'`;\\]/g, ''),
  alfanumerico: (v) => v.replace(/[^A-Za-z0-9]/g, ''),
};

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errores, setErrores] = useState({});
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();

  const soloAlfanumPass = (v) => /^[A-Za-z0-9]+$/.test(v);

  // Valida un campo individual y actualiza errores; devuelve true si es válido
  const validarCampo = (name, value) => {
    let msg = '';

    switch (name) {
      case 'email':
        if (!value.trim()) {
          msg = 'El correo electrónico es obligatorio.';
        } else if (!value.toLowerCase().endsWith('@fet.edu.co')) {
          msg = 'El correo electrónico debe terminar en @fet.edu.co';
        }
        break;

      case 'password':
        if (!value) {
          msg = 'La contraseña es obligatoria.';
        } else if (!soloAlfanumPass(value)) {
          msg = 'La contraseña solo puede contener letras y números (sin símbolos ni espacios).';
        } else if (value.length > 30) {
          msg = 'La contraseña no puede superar los 30 caracteres.';
        } else if (value.length < 6) {
          msg = 'La contraseña debe tener al menos 6 caracteres.';
        }
        break;

      default:
        break;
    }

    setErrores(prev => ({ ...prev, [name]: msg }));
    return msg === '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Filtro en tiempo real para contraseña (solo letras y números, máx 30)
    if (name === 'password') {
      const cleaned = sanitize.alfanumerico(value).slice(0, 30);
      setFormData(prev => ({ ...prev, [name]: cleaned }));
      validarCampo(name, cleaned);
      return;
    }

    // Filtro en tiempo real para correo (evitar símbolos peligrosos de inyección)
    if (name === 'email') {
      const cleaned = sanitize.email(value);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    // Validaciones antes de enviar
    const emailValido = validarCampo('email', formData.email);
    const passValido = validarCampo('password', formData.password);

    if (!emailValido || !passValido) {
      return;
    }

    // Sanitización final antes de enviar
    const payload = {
      email: sanitize.email(formData.email).trim(),
      password: sanitize.alfanumerico(formData.password),
    };

    try {
      const response = await api.post('/login', payload);
      const { access_token, user } = response.data;

      // Guardar token y datos del usuario
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirección inteligente por ROL
      if (user.rol === 'admin') {
        navigate('/dashboard');
      } else if (user.rol === 'tutor') {
        navigate('/tutor/dashboard');
      } else if (user.rol === 'estudiante' || !user.rol) {
        if (user.opcion_grado === 'pasantia') {
          navigate('/estudiante/pasantia');
        } else if (user.opcion_grado === 'seminario') {
          navigate('/estudiante/seminario');
        } else {
          navigate('/estudiante/proyecto');
        }
      } else {
        navigate('/'); // Fallback
      }

    } catch (error) {
      console.error('Error:', error.response);
      const status = error.response?.status;
      let msgAmigable = 'No se pudo conectar con el servidor. Intenta de nuevo más tarde.';

      if (status === 401) {
        msgAmigable = 'Correo o contraseña incorrectos. Verifica tus credenciales.';
      } else if (status === 403) {
        msgAmigable = 'Tu cuenta aún está pendiente de aprobación por el administrador.';
      } else if (status === 422) {
        msgAmigable = 'Los datos proporcionados no son válidos.';
      }

      setServerError(msgAmigable);
    }
  };

  // Helper para renderizar error del campo
  const FieldError = ({ campo }) =>
    errores[campo] ? <small className="field-error">{errores[campo]}</small> : null;

  return (
    /* Aquí usamos la nueva clase contenedora del fondo */
    <div className="login-page"> 
      <div className="container">
        
        {/* Lado izquierdo: El formulario */}
        <div className="form-container">
          <div className="logo">
            <img src="/IMG/logofet.png" alt="Logo MissionFet" />
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {serverError && <div className="mensaje error">{serverError}</div>}

            <div className="login-form-group">
              <label>Correo Electrónico</label>
              <input 
                type="email" 
                name="email"
                placeholder="ejemplo@fet.edu.co"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              <FieldError campo="email" />
            </div>

            <div className="login-form-group">
              <label>Contraseña <span className="hint-max">(letras y números, máx. 30)</span></label>
              <input 
                type="password" 
                name="password"
                placeholder="Tu contraseña"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={30}
                required
              />
              <FieldError campo="password" />
            </div>

            <div className="forgot-password">
              <a href="#" className="forgot-password-link">¿Olvidaste tu contraseña?</a>
            </div>

            <button type="submit" className="register-btn">
              Iniciar Sesión
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px', color: 'white' }}>
              ¿No tienes una cuenta?{' '}
              <button 
                type="button" 
                onClick={() => navigate('/registro')}
                style={{ background: 'none', border: 'none', color: '#00ff00', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Regístrate aquí
              </button>
            </div>

          </form>
        </div>

        {/* Lado derecho: Imagen promocional */}
        <div className="promo-image">
          <img src="/IMG/image.png" alt="Misión FET" />
        </div>

      </div>
    </div>
  );
}