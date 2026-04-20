import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './GestionProyectos.css'; 

const AprobacionUsuarios = () => {
    const navigate = useNavigate();
    // Cambiamos a true por defecto para que el navegador se vea al cargar en escritorio
    const [navActive, setNavActive] = useState(true); 
    const [activeTab, setActiveTab] = useState('solicitudes');
    const [mensaje, setMensaje] = useState({ text: '', type: '' });

    const [solicitudes, setSolicitudes] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchDatos();
    }, []);

    const fetchDatos = async () => {
        try {
            const [resPendientes, resHistorial] = await Promise.all([
                api.get('/admin/aprobaciones'),
                api.get('/admin/historial')
            ]);
            setSolicitudes(Array.isArray(resPendientes.data) ? resPendientes.data : []);
            setHistorial(Array.isArray(resHistorial.data) ? resHistorial.data : []);
        } catch (error) {
            console.error("Error al cargar datos:", error);
            setSolicitudes([]);
            setHistorial([]);
        }
    };

    const mostrarMensaje = (text, type) => {
        setMensaje({ text, type });
        setTimeout(() => setMensaje({ text: '', type: '' }), 5000);
    };

    const getFilteredData = (dataList) => {
        if (!Array.isArray(dataList)) return [];
        return dataList.filter(item => {
            const search = searchTerm.toLowerCase();
            return (
                item.nombre?.toLowerCase().includes(search) ||
                item.email?.toLowerCase().includes(search) ||
                item.documento?.includes(search)
            );
        });
    };

    const handleAprobar = async (id) => {
        try {
            await api.post(`/admin/aprobaciones/${id}/aprobar`);
            mostrarMensaje('¡Usuario aprobado correctamente!', 'exito');
            fetchDatos();
        } catch (error) {
            mostrarMensaje('Error al aprobar usuario', 'error');
        }
    };

    const handleRechazar = async (id) => {
        if (!window.confirm('¿Deseas rechazar esta solicitud?')) return;
        try {
            await api.post(`/admin/aprobaciones/${id}/rechazar`);
            mostrarMensaje('Solicitud rechazada', 'exito');
            fetchDatos();
        } catch (error) {
            mostrarMensaje('Error al rechazar solicitud', 'error');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className={`admin-layout ${navActive ? 'nav-active' : ''}`}>
            
            {/* LOGO FLOTANTE PARA ACTIVAR/DESACTIVAR NAV */}
            <div id="logo" onClick={() => setNavActive(!navActive)}>
                <img src="/IMG/logofet.png" alt="Logo FET" className="logo-img" />
            </div>

            {/* NAVEGADOR LATERAL */}
            <nav id="navbar" className={navActive ? 'active' : ''}>
                <div className="nav-header">
                    <div id="nav-logo">
                        <img src="/IMG/logofet.png" alt="Logo FET" className="logo-img" />
                    </div>
                    <ul>
                        <li><Link to="/dashboard">Inicio</Link></li>
                        <li><Link to="/aprobacion" className="active">Aprobación de Usuarios</Link></li>
                        <li><Link to="/usuarios">Gestión de Usuarios</Link></li>
                        <li className="dropdown">
                            <a href="#">Gestión de Modalidades</a>
                            <ul className="dropdown-content">
                                <li><Link to="/seminarios">Seminario</Link></li>
                                <li><Link to="/proyectos">Proyectos</Link></li>
                                <li><Link to="/pasantias">Pasantías</Link></li>
                            </ul>
                        </li>
                        <li><Link to="/reportes">Reportes</Link></li>
                        <li><a href="#" onClick={handleLogout}>Cerrar Sesión</a></li>
                    </ul>
                </div>
            </nav>

            {/* CONTENIDO PRINCIPAL */}
            <main className={navActive ? 'nav-active' : ''}>
                <h1>Aprobación de Usuarios</h1>
                
                {mensaje.text && <div className={`mensaje ${mensaje.type}`}>{mensaje.text}</div>}

                <div className="search-filter">
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre, documento o correo..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="tabs">
                    <button className={activeTab === 'solicitudes' ? 'active' : ''} onClick={() => setActiveTab('solicitudes')}>
                        Pendientes
                    </button>
                    <button className={activeTab === 'historial' ? 'active' : ''} onClick={() => setActiveTab('historial')}>
                        Historial
                    </button>
                </div>

                <div className="table-container">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Nombre Completo</th>
                                <th>Rol</th>
                                <th>Documento</th>
                                <th>Correo</th>
                                {activeTab === 'solicitudes' ? <th>Acciones</th> : <th>Estado Final</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {activeTab === 'solicitudes' ? (
                                getFilteredData(solicitudes).length === 0 ? (
                                    <tr><td colSpan="5" style={{textAlign: 'center'}}>No hay solicitudes pendientes</td></tr>
                                ) : (
                                    getFilteredData(solicitudes).map(sol => (
                                        <tr key={sol.id}>
                                            <td>{sol.nombre}</td>
                                            <td>{sol.rol}</td>
                                            <td>{sol.documento}</td>
                                            <td>{sol.email}</td>
                                            <td className="actions">
                                                <button onClick={() => handleAprobar(sol.id)} className="edit">✔</button>
                                                <button onClick={() => handleRechazar(sol.id)} className="delete">✖</button>
                                            </td>
                                        </tr>
                                    ))
                                )
                            ) : (
                                getFilteredData(historial).length === 0 ? (
                                    <tr><td colSpan="5" style={{textAlign: 'center'}}>Historial vacío</td></tr>
                                ) : (
                                    getFilteredData(historial).map(his => (
                                        <tr key={his.id}>
                                            <td>{his.nombre}</td>
                                            <td>{his.rol}</td>
                                            <td>{his.documento}</td>
                                            <td>{his.email}</td>
                                            <td>
                                                <span className={`status ${his.estado_final}`}>{his.estado_final}</span>
                                            </td>
                                        </tr>
                                    ))
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default AprobacionUsuarios;