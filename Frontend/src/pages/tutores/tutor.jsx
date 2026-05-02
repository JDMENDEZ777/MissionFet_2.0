import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './tutor.css';

const TutorDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        total_pasantias: 0,
        total_proyectos: 0,
        pasantias_pendientes: 0,
        proyectos_pendientes: 0,
        mensajes_pasantias: 0,
        notificaciones_pasantias: 0,
        notificaciones_proyectos: 0,
        tiene_pasantias: false,
        tiene_proyectos: false
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser || storedUser.rol !== 'tutor') {
            navigate('/login');
            return;
        }
        setUser(storedUser);
        fetchStats();
    }, [navigate]);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8000/api/tutor/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching tutor stats:', err);
            setError('Error al cargar las estadísticas. Por favor, intente de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const goToPasantias = () => {
        if (stats.tiene_pasantias) {
            navigate('/tutor/pasantias');
        }
    };

    const goToProyectos = () => {
        if (stats.tiene_proyectos) {
            navigate('/tutor/proyectos');
        }
    };

    if (loading) return <div className="portal-tutor-wrapper"><div className="main-content">Cargando portal...</div></div>;

    return (
        <div className="portal-tutor-wrapper">
            <header className="top-header">
                <div className="header-logo">
                    <img src="/IMG/logofet.png" alt="FET Logo" style={{ width: '120px' }} />
                </div>
                <div className="user-info">
                    <div className="user-avatar">
                        <i className="fas fa-user-tie"></i>
                    </div>
                    <div className="user-details">
                        <p className="user-name">{user?.name || user?.nombre || 'Tutor'}</p>
                        <p className="user-role">Tutor Académico</p>
                    </div>
                </div>
            </header>

            <main className="main-content">
                <div className="welcome-container">
                    <div className="welcome-header">
                        <h2>Bienvenido al Portal del Tutor</h2>
                        <p>Seleccione una opción para continuar</p>
                    </div>

                    {error && <div className="error-message" style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>{error}</div>}

                    <div className="options-container">
                        {/* Tarjeta Pasantías */}
                        <div className={`option-card ${!stats.tiene_pasantias ? 'disabled' : ''}`}>
                            <div className="option-icon">
                                <i className="fas fa-briefcase"></i>
                                {stats.notificaciones_pasantias > 0 && (
                                    <span className="notification-badge">{stats.notificaciones_pasantias}</span>
                                )}
                            </div>
                            <h3>Gestionar Pasantías</h3>
                            <p>Supervise y evalúe las pasantías asignadas</p>
                            <div className="option-stats">
                                <div className="stat-item">
                                    <span className="stat-value">{stats.total_pasantias}</span>
                                    <span className="stat-label">Pasantías</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-value">{stats.pasantias_pendientes}</span>
                                    <span className="stat-label">Pendientes</span>
                                </div>
                            </div>
                            <button 
                                onClick={goToPasantias} 
                                className={`option-button ${!stats.tiene_pasantias ? 'disabled' : ''}`}
                                disabled={!stats.tiene_pasantias}
                            >
                                <i className="fas fa-arrow-right"></i> Acceder
                            </button>
                            {!stats.tiene_pasantias && (
                                <div className="option-disabled-message">
                                    <i className="fas fa-lock"></i> No tiene pasantías asignadas
                                </div>
                            )}
                        </div>

                        {/* Tarjeta Proyectos */}
                        <div className={`option-card ${!stats.tiene_proyectos ? 'disabled' : ''}`}>
                            <div className="option-icon">
                                <i className="fas fa-project-diagram"></i>
                                {stats.notificaciones_proyectos > 0 && (
                                    <span className="notification-badge">{stats.notificaciones_proyectos}</span>
                                )}
                            </div>
                            <h3>Gestionar Proyectos</h3>
                            <p>Supervise y evalúe los proyectos asignados</p>
                            <div className="option-stats">
                                <div className="stat-item">
                                    <span className="stat-value">{stats.total_proyectos}</span>
                                    <span className="stat-label">Proyectos</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-value">{stats.proyectos_pendientes}</span>
                                    <span className="stat-label">Pendientes</span>
                                </div>
                            </div>
                            <button 
                                onClick={goToProyectos} 
                                className={`option-button ${!stats.tiene_proyectos ? 'disabled' : ''}`}
                                disabled={!stats.tiene_proyectos}
                            >
                                <i className="fas fa-arrow-right"></i> Acceder
                            </button>
                            {!stats.tiene_proyectos && (
                                <div className="option-disabled-message">
                                    <i className="fas fa-lock"></i> No tiene proyectos asignados
                                </div>
                            )}
                        </div>

                        {/* Tarjeta Cerrar Sesión */}
                        <div className="option-card logout-card">
                            <div className="option-icon">
                                <i className="fas fa-sign-out-alt"></i>
                            </div>
                            <h3>Cerrar Sesión</h3>
                            <p>Salir del sistema de forma segura</p>
                            <button onClick={handleLogout} className="option-button logout-button">
                                <i className="fas fa-power-off"></i> Salir
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="footer">
                <p>&copy; {new Date().getFullYear()} Sistema de Gestión Académica. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
};

export default TutorDashboard;
