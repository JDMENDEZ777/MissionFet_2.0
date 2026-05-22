import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './Reportes.css';

export default function Reportes() {
  const navigate = useNavigate();
  const [navActive, setNavActive] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Datos
  const [metricas, setMetricas] = useState({
    total_estudiantes: 0,
    total_tutores: 0,
    total_proyectos: 0,
    total_pasantias: 0,
    total_seminarios: 0,
    distribucion_opcion_grado: [],
    estudiantes_por_ciclo: [],
    proyectos_por_estado: [],
    pasantias_por_estado: [],
    seminarios_por_estado: [],
    lista_estudiantes: [],
    lista_proyectos: [],
    lista_pasantias: [],
    lista_seminarios: []
  });

  // Filtros Tablas
  const [filtroEst, setFiltroEst] = useState({ buscar: '', opcion: '', ciclo: '' });
  const [filtroProy, setFiltroProy] = useState({ buscar: '', estado: '' });
  const [filtroPas, setFiltroPas] = useState({ buscar: '', estado: '' });
  const [filtroSem, setFiltroSem] = useState({ buscar: '', estado: '' });

  // Referencias para los gráficos
  const chartRefs = useRef({});
  const canvasRefs = {
    opcionGrado: useRef(null),
    ciclo: useRef(null),
    proyectosEstado: useRef(null),
    pasantiasEstado: useRef(null),
    // Full charts
    opcionGradoFull: useRef(null),
    cicloFull: useRef(null),
    proyectosEstadoFull: useRef(null),
    pasantiasEstadoFull: useRef(null),
    seminariosEstado: useRef(null)
  };

  const [chartScriptLoaded, setChartScriptLoaded] = useState(false);

  useEffect(() => {
    // Cargar Chart.js desde CDN dinámicamente como en V1
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.async = true;
    script.onload = () => setChartScriptLoaded(true);
    document.body.appendChild(script);

    cargarDatos();

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!loading && metricas && chartScriptLoaded) {
      renderizarGraficos();
    }
  }, [loading, metricas, activeTab, chartScriptLoaded]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/reportes');
      setMetricas(res.data);
    } catch (err) {
      setError('Error al cargar los datos del servidor.');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No establecida';
    const d = new Date(fecha);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const exportarCSV = (tablaId, nombreArchivo) => {
    const tabla = document.getElementById(tablaId);
    if (!tabla) return;
    
    let csv = [];
    const filas = tabla.querySelectorAll('tr');
    
    for (let i = 0; i < filas.length; i++) {
      let fila = [], cols = filas[i].querySelectorAll('td, th');
      
      for (let j = 0; j < cols.length; j++) {
        let elemento = cols[j];
        let texto = elemento.innerText.trim();
        
        // Si el elemento contiene una barra de progreso, extraemos el porcentaje de avance
        const progressFill = elemento.querySelector('.re-progress-fill');
        if (progressFill && progressFill.style.width) {
          texto = progressFill.style.width;
        }
        
        // Escapar comillas dobles
        texto = texto.replace(/"/g, '""');
        fila.push('"' + texto + '"');
      }
      csv.push(fila.join(';'));
    }
    
    // Agregamos BOM de UTF-8 para que Excel reconozca los acentos y eñes correctamente
    // Nota: Evitamos usar "sep=;\n" porque en muchas versiones de Excel anula el BOM y rompe la codificación.
    const csvContent = "\ufeff" + csv.join('\n');
    const csvFile = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(csvFile);
    link.download = `${nombreArchivo}_${formatearFecha(new Date()).replace(/\//g, '-')}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Funciones de gráficos
  const destroyChart = (id) => {
    if (chartRefs.current[id]) {
      chartRefs.current[id].destroy();
    }
  };

  const prepararDatos = (datos, campo, coloresObj) => {
    const etiquetas = [];
    const valores = [];
    const colores = [];
    datos.forEach(item => {
      const etiq = item[campo] ? (item[campo].charAt(0).toUpperCase() + item[campo].slice(1)).replace(/_/g, ' ') : 'No asignado';
      etiquetas.push(etiq);
      valores.push(item.total);
      colores.push(coloresObj[item[campo] || 'default'] || '#95a5a6');
    });
    return { etiquetas, valores, colores };
  };

  const renderizarGraficos = () => {
    const coloresOpcion = { 'seminario': '#3498db', 'proyecto': '#2ecc71', 'pasantia': '#e74c3c', 'default': '#95a5a6' };
    const coloresCiclo = { 'tecnico': '#3498db', 'tecnologo': '#2ecc71', 'profesional': '#e74c3c', 'default': '#95a5a6' };
    const coloresEstado = { 'propuesto': '#3498db', 'en_revision': '#9b59b6', 'aprobado': '#2ecc71', 'rechazado': '#e74c3c', 'en_proceso': '#f39c12', 'finalizado': '#34495e', 'pendiente': '#f39c12', 'aprobada': '#2ecc71', 'rechazada': '#e74c3c', 'finalizada': '#34495e', 'activo': '#2ecc71', 'cancelado': '#e74c3c', 'default': '#95a5a6' };

    const datOpcion = prepararDatos(metricas.distribucion_opcion_grado || [], 'opcion_grado', coloresOpcion);
    const datCiclo = prepararDatos(metricas.estudiantes_por_ciclo || [], 'ciclo', coloresCiclo);
    const datProyectos = prepararDatos(metricas.proyectos_por_estado || [], 'estado', coloresEstado);
    const datPasantias = prepararDatos(metricas.pasantias_por_estado || [], 'estado', coloresEstado);
    const datSeminarios = prepararDatos(metricas.seminarios_por_estado || [], 'estado', coloresEstado);

    if (activeTab === 'dashboard') {
      crearGraficaPie('opcionGrado', canvasRefs.opcionGrado.current, datOpcion);
      crearGraficaPie('ciclo', canvasRefs.ciclo.current, datCiclo);
      crearGraficaPie('proyectosEstado', canvasRefs.proyectosEstado.current, datProyectos);
      crearGraficaPie('pasantiasEstado', canvasRefs.pasantiasEstado.current, datPasantias);
    } else if (activeTab === 'graficas') {
      crearGraficaBar('opcionGradoFull', canvasRefs.opcionGradoFull.current, datOpcion, 'Distribución Opción Grado');
      crearGraficaBar('cicloFull', canvasRefs.cicloFull.current, datCiclo, 'Estudiantes por Ciclo');
      crearGraficaBar('proyectosEstadoFull', canvasRefs.proyectosEstadoFull.current, datProyectos, 'Proyectos por Estado');
      crearGraficaBar('pasantiasEstadoFull', canvasRefs.pasantiasEstadoFull.current, datPasantias, 'Pasantías por Estado');
      crearGraficaBar('seminariosEstado', canvasRefs.seminariosEstado.current, datSeminarios, 'Seminarios por Estado');
    }
  };

  const crearGraficaPie = (id, canvas, datos) => {
    if (!canvas || !window.Chart) return;
    destroyChart(id);
    chartRefs.current[id] = new window.Chart(canvas, {
      type: 'pie',
      data: { labels: datos.etiquetas, datasets: [{ data: datos.valores, backgroundColor: datos.colores }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
  };

  const crearGraficaBar = (id, canvas, datos, titulo) => {
    if (!canvas || !window.Chart) return;
    destroyChart(id);
    chartRefs.current[id] = new window.Chart(canvas, {
      type: 'bar',
      data: { labels: datos.etiquetas, datasets: [{ label: titulo, data: datos.valores, backgroundColor: datos.colores }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  };

  // Filtrado
  const estFiltrados = (metricas.lista_estudiantes || []).filter(e => {
    const s = filtroEst.buscar.toLowerCase();
    const matchSearch = !s || (e.nombre?.toLowerCase().includes(s) || e.documento?.includes(s) || e.codigo_estudiante?.toLowerCase().includes(s));
    const matchOp = !filtroEst.opcion || e.opcion_grado === filtroEst.opcion;
    const matchCi = !filtroEst.ciclo || e.ciclo === filtroEst.ciclo;
    return matchSearch && matchOp && matchCi;
  });

  const proyFiltrados = (metricas.lista_proyectos || []).filter(p => {
    const s = filtroProy.buscar.toLowerCase();
    const matchSearch = !s || p.titulo?.toLowerCase().includes(s);
    const matchEst = !filtroProy.estado || p.estado === filtroProy.estado;
    return matchSearch && matchEst;
  });

  const pasFiltrados = (metricas.lista_pasantias || []).filter(p => {
    const s = filtroPas.buscar.toLowerCase();
    const matchSearch = !s || (p.titulo?.toLowerCase().includes(s) || p.empresa?.toLowerCase().includes(s) || p.estudiante_nombre?.toLowerCase().includes(s));
    const matchEst = !filtroPas.estado || p.estado === filtroPas.estado;
    return matchSearch && matchEst;
  });

  const semFiltrados = (metricas.lista_seminarios || []).filter(s => {
    const q = filtroSem.buscar.toLowerCase();
    const matchSearch = !q || s.titulo?.toLowerCase().includes(q);
    const matchEst = !filtroSem.estado || s.estado === filtroSem.estado;
    return matchSearch && matchEst;
  });

  return (
    <div className="modulo-reportes">
      {/* NAVBAR */}
      <div id="re-logo" onClick={() => setNavActive(!navActive)}>
        <img src="/IMG/logofet.png" alt="Logo FET" className="re-logo-img" />
      </div>

      <nav id="re-navbar" className={navActive ? 'active' : ''}>
        <div className="re-nav-header">
          
          <ul>
            <li><Link to="/dashboard">Inicio</Link></li>
            <li><Link to="/aprobacion">Aprobación de Usuarios</Link></li>
            <li><Link to="/usuarios">Gestión de Usuarios</Link></li>
            <li className="re-dropdown">
              <a href="#">Gestión de Modalidades de Grado</a>
              <ul className="re-dropdown-content">
                <li><Link to="/seminarios">Seminario</Link></li>
                <li><Link to="/proyectos">Proyectos</Link></li>
                <li><Link to="/pasantias">Pasantías</Link></li>
              </ul>
            </li>
            <li><Link to="/reportes" className="active">Reportes y Estadísticas</Link></li>
            <li><a href="#" onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>Cerrar Sesión</a></li>
          </ul>
        </div>
      </nav>

      <main className={`re-main${navActive ? ' nav-active' : ''}`}>
        <h1 className="re-h1">Reportes y Estadísticas</h1>

        {error && <div className="re-mensaje error">{error}</div>}

        {loading ? <div className="re-loading">⏳ Cargando métricas y datos...</div> : (
          <>
            <div className="re-tabs">
              <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>Panel General</button>
              <button className={activeTab === 'graficas' ? 'active' : ''} onClick={() => setActiveTab('graficas')}>Gráficas</button>
              <button className={activeTab === 'estudiantes' ? 'active' : ''} onClick={() => setActiveTab('estudiantes')}>Estudiantes</button>
              <button className={activeTab === 'proyectos' ? 'active' : ''} onClick={() => setActiveTab('proyectos')}>Proyectos</button>
              <button className={activeTab === 'pasantias' ? 'active' : ''} onClick={() => setActiveTab('pasantias')}>Pasantías</button>
              <button className={activeTab === 'seminarios' ? 'active' : ''} onClick={() => setActiveTab('seminarios')}>Seminarios</button>
            </div>

            {/* TAB: PANEL GENERAL */}
            {activeTab === 'dashboard' && (
              <section className="tab-content active">
                <h2 className="re-h2">Panel General</h2>
                <div className="re-cards-grid">
                  <div className="re-card">
                    <div className="re-card-icon">👨‍🎓</div>
                    <div className="re-card-title">Estudiantes Activos</div>
                    <div className="re-card-value">{metricas.total_estudiantes || 0}</div>
                  </div>
                  <div className="re-card">
                    <div className="re-card-icon">👨‍🏫</div>
                    <div className="re-card-title">Tutores</div>
                    <div className="re-card-value">{metricas.total_tutores || 0}</div>
                  </div>
                  <div className="re-card">
                    <div className="re-card-icon">📁</div>
                    <div className="re-card-title">Proyectos</div>
                    <div className="re-card-value">{metricas.total_proyectos || 0}</div>
                  </div>
                  <div className="re-card">
                    <div className="re-card-icon">🧪</div>
                    <div className="re-card-title">Pasantías</div>
                    <div className="re-card-value">{metricas.total_pasantias || 0}</div>
                  </div>
                  <div className="re-card">
                    <div className="re-card-icon">📚</div>
                    <div className="re-card-title">Seminarios</div>
                    <div className="re-card-value">{metricas.total_seminarios || 0}</div>
                  </div>
                </div>

                <div className="re-charts-grid">
                  <div className="re-chart-card">
                    <div className="re-chart-title">Opción de Grado</div>
                    <div className="re-chart-canvas-wrapper"><canvas ref={canvasRefs.opcionGrado}></canvas></div>
                  </div>
                  <div className="re-chart-card">
                    <div className="re-chart-title">Estudiantes por Ciclo</div>
                    <div className="re-chart-canvas-wrapper"><canvas ref={canvasRefs.ciclo}></canvas></div>
                  </div>
                  <div className="re-chart-card">
                    <div className="re-chart-title">Proyectos por Estado</div>
                    <div className="re-chart-canvas-wrapper"><canvas ref={canvasRefs.proyectosEstado}></canvas></div>
                  </div>
                  <div className="re-chart-card">
                    <div className="re-chart-title">Pasantías por Estado</div>
                    <div className="re-chart-canvas-wrapper"><canvas ref={canvasRefs.pasantiasEstado}></canvas></div>
                  </div>
                </div>
              </section>
            )}

            {/* TAB: GRAFICAS */}
            {activeTab === 'graficas' && (
              <section className="tab-content active">
                <h2 className="re-h2">Gráficas Estadísticas</h2>
                <div className="re-charts-grid">
                  <div className="re-chart-card">
                    <div className="re-chart-title">Distribución Opción Grado</div>
                    <div className="re-chart-canvas-wrapper"><canvas ref={canvasRefs.opcionGradoFull}></canvas></div>
                  </div>
                  <div className="re-chart-card">
                    <div className="re-chart-title">Estudiantes por Ciclo</div>
                    <div className="re-chart-canvas-wrapper"><canvas ref={canvasRefs.cicloFull}></canvas></div>
                  </div>
                  <div className="re-chart-card">
                    <div className="re-chart-title">Proyectos por Estado</div>
                    <div className="re-chart-canvas-wrapper"><canvas ref={canvasRefs.proyectosEstadoFull}></canvas></div>
                  </div>
                  <div className="re-chart-card">
                    <div className="re-chart-title">Pasantías por Estado</div>
                    <div className="re-chart-canvas-wrapper"><canvas ref={canvasRefs.pasantiasEstadoFull}></canvas></div>
                  </div>
                  <div className="re-chart-card">
                    <div className="re-chart-title">Seminarios por Estado</div>
                    <div className="re-chart-canvas-wrapper"><canvas ref={canvasRefs.seminariosEstado}></canvas></div>
                  </div>
                </div>
              </section>
            )}

            {/* TAB: ESTUDIANTES */}
            {activeTab === 'estudiantes' && (
              <section className="tab-content active">
                <h2 className="re-h2">Listado de Estudiantes</h2>
                <div className="re-table-container">
                  <div className="re-table-header">
                    <div className="re-table-title">Estudiantes Registrados</div>
                    <div className="re-table-filter">
                      <input type="text" placeholder="Buscar estudiante..." value={filtroEst.buscar} onChange={e => setFiltroEst({...filtroEst, buscar: e.target.value})} />
                      <select value={filtroEst.opcion} onChange={e => setFiltroEst({...filtroEst, opcion: e.target.value})}>
                        <option value="">Todas las opciones</option>
                        <option value="seminario">Seminario</option>
                        <option value="proyecto">Proyecto</option>
                        <option value="pasantia">Pasantía</option>
                      </select>
                      <select value={filtroEst.ciclo} onChange={e => setFiltroEst({...filtroEst, ciclo: e.target.value})}>
                        <option value="">Todos los ciclos</option>
                        <option value="tecnico">Técnico</option>
                        <option value="tecnologo">Tecnólogo</option>
                        <option value="profesional">Profesional</option>
                      </select>
                    </div>
                  </div>
                  <button className="re-export-btn" onClick={() => exportarCSV('tabla-est', 'Estudiantes')}>📊 Exportar CSV</button>
                  <div className="re-table-responsive">
                    <table id="tabla-est" className="re-tabla">
                      <thead>
                        <tr>
                          <th>ID</th><th>Nombre</th><th>Código</th><th>Documento</th><th>Email</th><th>Opción Grado</th><th>Ciclo</th><th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estFiltrados.length === 0 ? <tr><td colSpan="8" className="re-no-data">No hay datos.</td></tr> :
                          estFiltrados.map(e => (
                            <tr key={e.id}>
                              <td>{e.id}</td><td>{e.nombre}</td><td>{e.codigo_estudiante || 'N/A'}</td><td>{e.documento}</td><td>{e.email}</td>
                              <td><span className={`re-badge re-badge-${e.opcion_grado || 'default'}`}>{e.opcion_grado || 'N/A'}</span></td>
                              <td>{e.ciclo || 'N/A'}</td>
                              <td><span className={`re-badge re-badge-${e.estado}`}>{e.estado}</span></td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* TAB: PROYECTOS */}
            {activeTab === 'proyectos' && (
              <section className="tab-content active">
                <h2 className="re-h2">Listado de Proyectos</h2>
                <div className="re-table-container">
                  <div className="re-table-header">
                    <div className="re-table-title">Proyectos Registrados</div>
                    <div className="re-table-filter">
                      <input type="text" placeholder="Buscar proyecto..." value={filtroProy.buscar} onChange={e => setFiltroProy({...filtroProy, buscar: e.target.value})} />
                      <select value={filtroProy.estado} onChange={e => setFiltroProy({...filtroProy, estado: e.target.value})}>
                        <option value="">Todos los estados</option>
                        <option value="propuesto">Propuesto</option>
                        <option value="en_revision">En revisión</option>
                        <option value="aprobado">Aprobado</option>
                        <option value="rechazado">Rechazado</option>
                        <option value="en_proceso">En proceso</option>
                        <option value="finalizado">Finalizado</option>
                      </select>
                    </div>
                  </div>
                  <button className="re-export-btn" onClick={() => exportarCSV('tabla-proy', 'Proyectos')}>📊 Exportar CSV</button>
                  <div className="re-table-responsive">
                    <table id="tabla-proy" className="re-tabla">
                      <thead>
                        <tr><th>ID</th><th>Título</th><th>Estudiantes</th><th>Tutor</th><th>Estado</th><th>Fecha Creación</th></tr>
                      </thead>
                      <tbody>
                        {proyFiltrados.length === 0 ? <tr><td colSpan="6" className="re-no-data">No hay datos.</td></tr> :
                          proyFiltrados.map(p => (
                            <tr key={p.id}>
                              <td>{p.id}</td><td>{p.titulo}</td>
                              <td>{p.estudiantes?.length > 0 ? p.estudiantes.join(', ') : 'Sin asignar'}</td>
                              <td>{p.tutor_nombre || 'N/A'}</td>
                              <td><span className={`re-badge re-badge-${p.estado}`}>{p.estado.replace('_', ' ')}</span></td>
                              <td>{formatearFecha(p.fecha_creacion)}</td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* TAB: PASANTÍAS */}
            {activeTab === 'pasantias' && (
              <section className="tab-content active">
                <h2 className="re-h2">Listado de Pasantías</h2>
                <div className="re-table-container">
                  <div className="re-table-header">
                    <div className="re-table-title">Pasantías Registradas</div>
                    <div className="re-table-filter">
                      <input type="text" placeholder="Buscar..." value={filtroPas.buscar} onChange={e => setFiltroPas({...filtroPas, buscar: e.target.value})} />
                      <select value={filtroPas.estado} onChange={e => setFiltroPas({...filtroPas, estado: e.target.value})}>
                        <option value="">Todos los estados</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="aprobada">Aprobada</option>
                        <option value="rechazada">Rechazada</option>
                        <option value="en_proceso">En proceso</option>
                        <option value="finalizada">Finalizada</option>
                      </select>
                    </div>
                  </div>
                  <button className="re-export-btn" onClick={() => exportarCSV('tabla-pas', 'Pasantias')}>📊 Exportar CSV</button>
                  <div className="re-table-responsive">
                    <table id="tabla-pas" className="re-tabla">
                      <thead>
                        <tr><th>ID</th><th>Título</th><th>Estudiante</th><th>Empresa</th><th>Tutor</th><th>Estado</th><th>Inicio</th><th>Fin</th></tr>
                      </thead>
                      <tbody>
                        {pasFiltrados.length === 0 ? <tr><td colSpan="8" className="re-no-data">No hay datos.</td></tr> :
                          pasFiltrados.map(p => (
                            <tr key={p.id}>
                              <td>{p.id}</td><td>{p.titulo}</td><td>{p.estudiante_nombre || 'N/A'}</td><td>{p.empresa}</td><td>{p.tutor_nombre || 'N/A'}</td>
                              <td><span className={`re-badge re-badge-${p.estado}`}>{p.estado.replace('_', ' ')}</span></td>
                              <td>{formatearFecha(p.fecha_inicio)}</td><td>{formatearFecha(p.fecha_fin)}</td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* TAB: SEMINARIOS */}
            {activeTab === 'seminarios' && (
              <section className="tab-content active">
                <h2 className="re-h2">Listado de Seminarios</h2>
                <div className="re-table-container">
                  <div className="re-table-header">
                    <div className="re-table-title">Seminarios Registrados</div>
                    <div className="re-table-filter">
                      <input type="text" placeholder="Buscar..." value={filtroSem.buscar} onChange={e => setFiltroSem({...filtroSem, buscar: e.target.value})} />
                      <select value={filtroSem.estado} onChange={e => setFiltroSem({...filtroSem, estado: e.target.value})}>
                        <option value="">Todos</option>
                        <option value="activo">Activo</option>
                        <option value="finalizado">Finalizado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>
                  <button className="re-export-btn" onClick={() => exportarCSV('tabla-sem', 'Seminarios')}>📊 Exportar CSV</button>
                  <div className="re-table-responsive">
                    <table id="tabla-sem" className="re-tabla">
                      <thead>
                        <tr><th>ID</th><th>Título</th><th>Fecha</th><th>Modalidad</th><th>Tutor</th><th>Estado</th><th>Inscritos</th><th>Avance</th></tr>
                      </thead>
                      <tbody>
                        {semFiltrados.length === 0 ? <tr><td colSpan="8" className="re-no-data">No hay datos.</td></tr> :
                          semFiltrados.map(s => {
                            const porcentaje = (s.num_inscritos / s.cupos) * 100;
                            return (
                              <tr key={s.id}>
                                <td>{s.id}</td><td>{s.titulo}</td><td>{formatearFecha(s.fecha)}</td><td>{s.modalidad}</td><td>{s.tutor_nombre || 'N/A'}</td>
                                <td><span className={`re-badge re-badge-${s.estado}`}>{s.estado}</span></td>
                                <td>{s.num_inscritos} / {s.cupos}</td>
                                <td><div className="re-progress-bar"><div className="re-progress-fill" style={{ width: `${porcentaje}%` }}></div></div></td>
                              </tr>
                            );
                          })
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
