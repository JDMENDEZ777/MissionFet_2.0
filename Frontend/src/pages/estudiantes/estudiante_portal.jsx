import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './estudiante_portal.css';

const API = 'http://localhost:8000/api';

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export default function EstudiantePortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados de modalidades activos
  const [hasProyecto, setHasProyecto] = useState(false);
  const [hasPasantia, setHasPasantia] = useState(false);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user'));
    if (!u || u.rol !== 'estudiante') {
      navigate('/login');
      return;
    }
    setUser(u);
    verifyModalities();
  }, []);

  const verifyModalities = async () => {
    setLoading(true);
    try {
      // Consultar de forma concurrente ambos módulos para ver en cuál está inscrito
      const [rProj, rPas] = await Promise.allSettled([
        axios.get(`${API}/estudiante/proyecto`, getHeaders()),
        axios.get(`${API}/estudiante/pasantia`, getHeaders())
      ]);

      if (rProj.status === 'fulfilled' && rProj.value.data.success) {
        setHasProyecto(true);
      }
      if (rPas.status === 'fulfilled' && rPas.value.data.success) {
        setHasPasantia(true);
      }
    } catch (e) {
      console.error('Error verificando modalidades:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="sp-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '3rem', color: '#0369a1' }}></i>
          <p style={{ marginTop: '1rem', color: '#64748b', fontWeight: 600 }}>Cargando portal estudiantil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-wrapper">
      
      {/* HEADER */}
      <header className="sp-header">
        <div className="sp-logo">
          <img src="/IMG/logofet.png" alt="FET Logo" />
        </div>
        <div className="sp-user-profile">
          <div className="sp-avatar">
            {user ? user.name.charAt(0).toUpperCase() : 'E'}
          </div>
          <div className="sp-user-info">
            <p className="sp-user-name">{user ? user.name : 'Estudiante'}</p>
            <p className="sp-user-role">Código: {user ? user.codigo_estudiante : ''}</p>
          </div>
          <button 
            onClick={handleLogout} 
            className="sp-btn"
            style={{ 
              backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', 
              width: 'auto', padding: '0.5rem 1rem', fontSize: '0.8rem', marginLeft: '1rem' 
            }}
          >
            <i className="fas fa-sign-out-alt"></i> Salir
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="sp-main">
        <div className="sp-container">
          
          <div className="sp-welcome-card">
            <h2>Bienvenido al Portal de Estudiantes FET</h2>
            <p>Selecciona tu modalidad académica activa para gestionar tus avances, bitácoras y actas.</p>
          </div>

          <div className="sp-options-grid">
            
            {/* Modalidad: Proyectos */}
            <div className={`sp-option-card ${!hasProyecto ? 'disabled' : ''}`}>
              <div className="sp-option-icon project">
                <i className="fas fa-project-diagram"></i>
              </div>
              <h3>Proyecto de Aplicación</h3>
              <p>Sube tus avances estructurados, recibe comentarios de tu docente tutor y califica los entregables de tu proyecto.</p>
              
              {hasProyecto ? (
                <button 
                  className="sp-btn sp-btn-project"
                  onClick={() => navigate('/estudiante/proyecto')}
                >
                  Ingresar a Proyectos <i className="fas fa-arrow-right"></i>
                </button>
              ) : (
                <>
                  <button className="sp-btn disabled" disabled>Bloqueado</button>
                  <div className="sp-lock-overlay">
                    <i className="fas fa-lock"></i> No tienes proyectos asignados
                  </div>
                </>
              )}
            </div>

            {/* Modalidad: Pasantías */}
            <div className={`sp-option-card ${!hasPasantia ? 'disabled' : ''}`}>
              <div className="sp-option-icon pasantia">
                <i className="fas fa-briefcase"></i>
              </div>
              <h3>Pasantías Profesionales</h3>
              <p>Rellena tu Acta de Inicio, Plan de Trabajo de convenio, carga tus reportes de asistencia semanales y consulta tu ponderado.</p>
              
              {hasPasantia ? (
                <button 
                  className="sp-btn sp-btn-pasantia"
                  onClick={() => navigate('/estudiante/pasantia')}
                >
                  Ingresar a Pasantías <i className="fas fa-arrow-right"></i>
                </button>
              ) : (
                <>
                  <button className="sp-btn disabled" disabled>Bloqueado</button>
                  <div className="sp-lock-overlay">
                    <i className="fas fa-lock"></i> No tienes pasantía activa
                  </div>
                </>
              )}
            </div>

          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="sp-footer">
        <p>&copy; {new Date().getFullYear()} FET - Fundación Escuela Tecnológica. Todos los derechos reservados.</p>
      </footer>

    </div>
  );
}
