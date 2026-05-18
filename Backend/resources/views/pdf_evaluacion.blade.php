<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Evaluación Pasantía Corte {{ $corte === 1 ? '40%' : '60%' }} - {{ $p->estudiante_nombre }}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            font-size: 8.5pt;
            line-height: 1.35;
            color: #1e293b;
            margin: 0;
            padding: 15px;
            background-color: #fff;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }
        .header-table td {
            border: 1px solid #94a3b8;
            padding: 6px;
            vertical-align: middle;
            text-align: center;
        }
        .header-logo img {
            max-height: 35px;
        }
        .header-title {
            font-weight: bold;
            font-size: 10pt;
            color: #0f172a;
        }
        .header-meta {
            font-size: 7pt;
            text-align: left !important;
            color: #475569;
        }
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }
        .meta-table th, .meta-table td {
            border: 1px solid #cbd5e1;
            padding: 5px 8px;
            text-align: left;
        }
        .meta-table th {
            background-color: #f1f5f9;
            font-weight: bold;
            color: #334155;
            width: 20%;
        }
        .evaluation-title {
            background-color: #15803d;
            color: white;
            font-weight: bold;
            font-size: 11pt;
            text-align: center;
            padding: 6px;
            margin-bottom: 10px;
            border-radius: 2px;
            text-transform: uppercase;
        }
        .scale-info {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 6px 12px;
            border-radius: 4px;
            color: #166534;
            font-weight: bold;
            margin-bottom: 12px;
            text-align: center;
            font-size: 9pt;
        }
        .grid-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .grid-table th {
            background-color: #15803d;
            color: white;
            padding: 6px 8px;
            font-weight: bold;
            text-align: left;
            text-transform: uppercase;
            font-size: 8.5pt;
        }
        .grid-table td {
            border: 1px solid #cbd5e1;
            padding: 5px 8px;
            vertical-align: top;
        }
        .criteria-list {
            margin: 0;
            padding: 0;
            list-style: none;
        }
        .criteria-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #f1f5f9;
            padding: 4px 0;
        }
        .criteria-item:last-child {
            border-bottom: none;
        }
        .criteria-text {
            width: 85%;
        }
        .criteria-grade {
            font-weight: bold;
            width: 12%;
            text-align: right;
            color: #15803d;
            font-size: 9.5pt;
        }
        .summary-box {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
        }
        .summary-title {
            font-weight: bold;
            color: #0f172a;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 3px;
            margin-bottom: 6px;
            font-size: 9.5pt;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            font-size: 9pt;
        }
        .final-grade-box {
            text-align: center;
            background-color: #dcfce7;
            border: 2px dashed #22c55e;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        .final-grade-value {
            font-size: 20pt;
            font-weight: bold;
            color: #15803d;
            margin-top: 4px;
        }
        .signatures-container {
            margin-top: 30px;
            width: 100%;
            border-collapse: collapse;
        }
        .signatures-container td {
            width: 33%;
            text-align: center;
            vertical-align: bottom;
            padding: 8px;
            border: none;
        }
        .signature-line {
            width: 85%;
            margin: 0 auto 5px auto;
            border-bottom: 1px solid #64748b;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .signature-img {
            max-height: 50px;
            max-width: 130px;
            object-fit: contain;
        }
        .signer-name {
            font-weight: bold;
            margin: 4px 0 2px 0;
            color: #0f172a;
            font-size: 8.5pt;
        }
        .signer-role {
            font-size: 7.5pt;
            color: #64748b;
        }
        @media print {
            @page {
                size: auto;
                margin: 10mm 15mm;
            }
            body {
                padding: 0;
                margin: 0;
            }
            .no-print {
                display: none;
            }
        }
        .print-btn-container {
            margin-bottom: 12px;
            text-align: right;
        }
        .print-btn {
            background-color: #15803d;
            color: white;
            border: none;
            padding: 6px 12px;
            font-size: 9pt;
            font-weight: bold;
            border-radius: 4px;
            cursor: pointer;
        }
        .print-btn:hover {
            background-color: #166534;
        }
    </style>
</head>
<body>

    <div class="print-btn-container no-print">
        <button class="print-btn" onclick="window.print()">Imprimir / Guardar como PDF</button>
    </div>

    <!-- Encabezado FET -->
    <table class="header-table">
        <tr>
            <td style="width: 25%;" class="header-logo">
                <img src="{{ $url_logofet }}" alt="FET Logo" onerror="this.src='/IMG/logofet.png'">
            </td>
            <td style="width: 50%;" class="header-title">
                EVALUACIÓN CUANTITATIVA DE ESTUDIANTES EN PRÁCTICAS PROFESIONALES
            </td>
            <td style="width: 25%;" class="header-meta">
                <strong>Código:</strong> PM-GFO-F-015<br>
                <strong>Versión:</strong> 02<br>
                <strong>Fecha:</strong> Abril/2021
            </td>
        </tr>
    </table>

    <div class="evaluation-title">Informe de Seguimiento Cuantitativo - Corte {{ $corte === 1 ? '40% (Semana 8-10)' : '60% (Semana 16)' }}</div>

    <table class="meta-table">
        <tr>
            <th>Agencia de Práctica:</th>
            <td>{{ $p->empresa }}</td>
            <th>Nombre del Tutor FET:</th>
            <td>{{ $p->tutor_nombre }}</td>
        </tr>
        <tr>
            <th>Nombre del Practicante:</th>
            <td>{{ $p->estudiante_nombre }}</td>
            <th>Nombre del Supervisor:</th>
            <td>{{ $p->supervisor_empresa ?: '—' }}</td>
        </tr>
    </table>

    <div class="scale-info">
        Rango de Calificación: 1: Bajo | 2: Regular | 3: Adecuado | 4: Bueno | 5: Excelente
    </div>

    <table class="grid-table">
        <thead>
            <tr>
                <th style="width: 34%;">1. ACTITUDINALES (25%)</th>
                <th style="width: 34%;">2. PROCEDIMENTAL (35%)</th>
                <th style="width: 32%;">3. COGNITIVOS (40%)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <ul class="criteria-list">
                        <li class="criteria-item">
                            <span class="criteria-text">Capacidad de cambio y adaptación</span>
                            <span class="criteria-grade">{{ $eval->nota_act_1 }}</span>
                        </li>
                        <li class="criteria-item">
                            <span class="criteria-text">Manejo adecuado de comunicación verbal</span>
                            <span class="criteria-grade">{{ $eval->nota_act_2 }}</span>
                        </li>
                        <li class="criteria-item">
                            <span class="criteria-text">Valores, aptitud y actitud proactiva</span>
                            <span class="criteria-grade">{{ $eval->nota_act_3 }}</span>
                        </li>
                        <li class="criteria-item">
                            <span class="criteria-text">Creatividad e innovación</span>
                            <span class="criteria-grade">{{ $eval->nota_act_4 }}</span>
                        </li>
                        <li class="criteria-item">
                            <span class="criteria-text">Apropiación de su cargo y funciones</span>
                            <span class="criteria-grade">{{ $eval->nota_act_5 }}</span>
                        </li>
                        <li class="criteria-item">
                            <span class="criteria-text">Trabajo en equipo y cooperación</span>
                            <span class="criteria-grade">{{ $eval->nota_act_6 }}</span>
                        </li>
                        <li class="criteria-item">
                            <span class="criteria-text">Manejo de relaciones interpersonales</span>
                            <span class="criteria-grade">{{ $eval->nota_act_7 }}</span>
                        </li>
                        <li class="criteria-item">
                            <span class="criteria-text">Respeto a directivos y compañeros</span>
                            <span class="criteria-grade">{{ $eval->nota_act_8 }}</span>
                        </li>
                        <li class="criteria-item">
                            <span class="criteria-text">Puntualidad y cumplimiento de tareas</span>
                            <span class="criteria-grade">{{ $eval->nota_act_9 }}</span>
                        </li>
                    </ul>
                </td>
                <td>
                    <ul class="criteria-list">
                        <li class="criteria-item">
                            <span class="criteria-text">Desarrollo de actividades del programa</span>
                            <span class="criteria-grade">{{ $eval->nota_proc_1 }}</span>
                        </li>
                        <li class="criteria-item">
                            <span class="criteria-text">Liderazgo y comunicación de ideas</span>
                            <span class="criteria-grade">{{ $eval->nota_proc_2 }}</span>
                        </li>
                        <li class="criteria-item">
                            <span class="criteria-text">Redacción y presentación de informes</span>
                            <span class="criteria-grade">{{ $eval->nota_proc_3 }}</span>
                        </li>
                        <li class="criteria-item">
                            <span class="criteria-text">Uso adecuado de comandos verbales</span>
                            <span class="criteria-grade">{{ $eval->nota_proc_4 }}</span>
                        </li>
                        <li class="criteria-item">
                            <span class="criteria-text">Aplica conocimientos en su labor</span>
                            <span class="criteria-grade">{{ $eval->nota_proc_5 }}</span>
                        </li>
                        <li class="criteria-item">
                            <span class="criteria-text">Capacidad de comunicación escrita</span>
                            <span class="criteria-grade">{{ $eval->nota_proc_6 }}</span>
                        </li>
                        <li class="criteria-item">
                            <span class="criteria-text">Habilidades para liderar procesos</span>
                            <span class="criteria-grade">{{ $eval->nota_proc_7 }}</span>
                        </li>
                        <li class="criteria-item">
                            <span class="criteria-text">Coordinación de actividades específicas</span>
                            <span class="criteria-grade">{{ $eval->nota_proc_8 }}</span>
                        </li>
                        <li class="criteria-item">
                            <span class="criteria-text">Organiza, maneja recursos y gestiona</span>
                            <span class="criteria-grade">{{ $eval->nota_proc_9 }}</span>
                        </li>
                    </ul>
                </td>
                <td>
                    <ul class="criteria-list">
                        <li class="criteria-item" style="background-color: #f8fafc; font-weight: bold; padding: 2px 4px;">
                            <span>INFORME DE PRÁCTICA</span>
                        </li>
                        <li class="criteria-item">
                            <span class="criteria-text">Primera entrega</span>
                            <span class="criteria-grade">{{ $eval->nota_cog_inf_1 }}</span>
                        </li>
                        <li class="criteria-item">
                            <span class="criteria-text">Entrega informe final</span>
                            <span class="criteria-grade">{{ $eval->nota_cog_inf_2 }}</span>
                        </li>
                        
                        <li class="criteria-item" style="background-color: #f8fafc; font-weight: bold; padding: 2px 4px; margin-top: 5px;">
                            <span>PROYECTO INVESTIGACIÓN</span>
                        </li>
                        <li class="criteria-item">
                            <span class="criteria-text">Primera entrega</span>
                            <span class="criteria-grade">{{ $eval->nota_cog_pro_1 }}</span>
                        </li>
                        <li class="criteria-item">
                            <span class="criteria-text">Entrega Final</span>
                            <span class="criteria-grade">{{ $eval->nota_cog_pro_2 }}</span>
                        </li>
                        
                        <li class="criteria-item" style="background-color: #f8fafc; font-weight: bold; padding: 2px 4px; margin-top: 5px;">
                            <span>DOMINIO CONOCIMIENTOS</span>
                        </li>
                        <li class="criteria-item">
                            <span class="criteria-text">Revisiones de tema</span>
                            <span class="criteria-grade">{{ $eval->nota_cog_dom_1 }}</span>
                        </li>
                        <li class="criteria-item">
                            <span class="criteria-text">Estudios de caso</span>
                            <span class="criteria-grade">{{ $eval->nota_cog_dom_2 }}</span>
                        </li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

    <div class="summary-box">
        <div class="summary-title">Promedios Obtenidos por Dimensión</div>
        <div class="summary-row">
            <span><strong>1. Promedio Dimensión Actitudinal (25%):</strong></span>
            <span>{{ $eval->promedio_actitudinal }} / 5.0</span>
        </div>
        <div class="summary-row">
            <span><strong>2. Promedio Dimensión Procedimental (35%):</strong></span>
            <span>{{ $eval->promedio_procedimental }} / 5.0</span>
        </div>
        <div class="summary-row">
            <span><strong>3. Promedio Dimensión Cognitiva (40%):</strong></span>
            <span>{{ $eval->promedio_cognitivo }} / 5.0</span>
        </div>
    </div>

    <div class="final-grade-box">
        <div><strong>NOTA DEL CORTE ({{ $corte === 1 ? '40%' : '60%' }})</strong></div>
        <div class="final-grade-value">{{ $eval->nota_corte }}</div>
    </div>

    @if($eval->comentarios)
        <div style="margin-bottom: 20px; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; background-color: #fff;">
            <strong>Comentarios / Observaciones del Tutor:</strong><br>
            {{ $eval->comentarios }}
        </div>
    @endif

    <!-- Firmas -->
    <table class="signatures-container">
        <tr>
            <td>
                <div class="signature-line">
                    @if($p->tutor_firma)
                        <img class="signature-img" src="{{ asset('uploads/pasantias/firmas/' . $p->tutor_firma) }}" alt="Firma Tutor">
                    @else
                        <span style="color: #94a3b8; font-size: 8pt;">Pendiente Firma</span>
                    @endif
                </div>
                <div class="signer-name">{{ $p->tutor_nombre ?: 'Juan Gabriel Carvajal Vega' }}</div>
                <div class="signer-role">Docente Tutor FET</div>
            </td>
            <td>
                <div class="signature-line">
                    @if($p->firma_supervisor)
                        <img class="signature-img" src="{{ asset('uploads/pasantias/firmas/' . $p->firma_supervisor) }}" alt="Firma Supervisor">
                    @else
                        <span style="color: #94a3b8; font-size: 8pt;">Pendiente Firma</span>
                    @endif
                </div>
                <div class="signer-name">{{ $p->supervisor_empresa ?: '___________________' }}</div>
                <div class="signer-role">Asesor de Práctica (Empresa)</div>
            </td>
            <td>
                <div class="signature-line">
                    @if($p->estudiante_firma)
                        <img class="signature-img" src="{{ asset('uploads/pasantias/firmas/' . $p->estudiante_firma) }}" alt="Firma Pasante">
                    @else
                        <span style="color: #94a3b8; font-size: 8pt;">Pendiente Firma</span>
                    @endif
                </div>
                <div class="signer-name">{{ $p->estudiante_nombre }}</div>
                <div class="signer-role">Pasante (Profesional en Formación)</div>
            </td>
        </tr>
    </table>

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 300);
        }
    </script>
</body>
</html>
