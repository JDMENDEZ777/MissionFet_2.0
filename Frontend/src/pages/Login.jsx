import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

// 1. IMPORTAMOS TU NUEVO CSS
import './Login.css'; 

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/login', formData);
      const user = response.data.user;
      
      // Guardar token y datos útiles en localStorage local
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user_name', user.name);
      localStorage.setItem('user_role', user.rol);
      
      // Redirigir dependiendo del rol del usuario
      if (user.rol === 'tutor') {
        navigate('/tutor/seminario');
      } else if (user.rol === 'estudiante') {
        navigate('/estudiante/seminario');
      } else {
        // Redirigir al panel de administrador por defecto
        navigate('/dashboard'); 
      }
      
    } catch (error) {
      console.error('Error:', error.response);
      alert('Error: ' + (error.response?.data?.message || 'No se pudo conectar verificá tus credenciales'));
    }
  };

  return (
    /* Aquí usamos la nueva clase contenedora del fondo */
    <div className="login-page"> 
      <div className="container">
        
        {/* Lado izquierdo: El formulario */}
        <div className="form-container">
          <div className="logo">
            {/* OJO: Ajusta esta ruta según dónde guardaste la imagen */}
            <img src="/IMG/logofet.png" alt="Logo MissionFet" />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label>Correo Electrónico</label>
                <input 
                  type="email" 
                  placeholder="ejemplo@fet.edu.co"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Contraseña</label>
                <input 
                  type="password" 
                  placeholder="Tu contraseña"
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
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
           {/* OJO: Ajusta esta ruta también */}
          <img src="/IMG/image.png" alt="Misión FET" />
        </div>

      </div>
    </div>
  );
}