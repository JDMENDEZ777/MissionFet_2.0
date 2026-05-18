<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Plan de Trabajo - {{ $p->estudiante_nombre }}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            color: #1e293b;
            margin: 0;
            padding: 20px;
            background-color: #fff;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .header-table td {
            border: 1px solid #94a3b8;
            padding: 8px;
            vertical-align: middle;
            text-align: center;
        }
        .header-logo img {
            max-height: 45px;
        }
        .header-title {
            font-weight: bold;
            font-size: 12pt;
            color: #0f172a;
        }
        .header-meta {
            font-size: 7.5pt;
            text-align: left !important;
            color: #475569;
        }
        .section-header {
            background-color: #047857;
            color: white;
            font-weight: bold;
            padding: 6px 10px;
            font-size: 10pt;
            margin-top: 15px;
            margin-bottom: 10px;
            border-radius: 2px;
            text-transform: uppercase;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .info-table th, .info-table td {
            border: 1px solid #cbd5e1;
            padding: 6px 10px;
            text-align: left;
            font-size: 9.5pt;
        }
        .info-table th {
            background-color: #f8fafc;
            font-weight: bold;
            color: #334155;
            width: 25%;
        }
        .activities-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 20px;
        }
        .activities-table th, .activities-table td {
            border: 1px solid #cbd5e1;
            padding: 8px 10px;
            text-align: left;
            font-size: 9pt;
        }
        .activities-table th {
            background-color: #047857;
            color: white;
            font-weight: bold;
            text-transform: uppercase;
        }
        .signatures-container {
            margin-top: 40px;
            width: 100%;
            border-collapse: collapse;
        }
        .signatures-container td {
            width: 33%;
            text-align: center;
            vertical-align: bottom;
            padding: 10px;
            border: none;
        }
        .signature-line {
            width: 85%;
            margin: 0 auto 5px auto;
            border-bottom: 1px solid #64748b;
            height: 70px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .signature-img {
            max-height: 60px;
            max-width: 150px;
            object-fit: contain;
        }
        .signer-name {
            font-weight: bold;
            margin: 4px 0 2px 0;
            color: #0f172a;
            font-size: 9pt;
        }
        .signer-role {
            font-size: 8pt;
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
            margin-bottom: 15px;
            text-align: right;
        }
        .print-btn {
            background-color: #047857;
            color: white;
            border: none;
            padding: 6px 12px;
            font-size: 9.5pt;
            font-weight: bold;
            border-radius: 4px;
            cursor: pointer;
        }
        .print-btn:hover {
            background-color: #065f46;
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
                PLAN DE TRABAJO DE CONVENIO DE PRÁCTICA
            </td>
            <td style="width: 25%;" class="header-meta">
                <strong>Código:</strong> PM-PSO-F-002<br>
                <strong>Versión:</strong> 01<br>
                <strong>Fecha:</strong> Enero/2018
            </td>
        </tr>
    </table>

    <!-- Datos del Convenio -->
    <div class="section-header">1. Datos del Convenio</div>
    <table class="info-table">
        <tr>
            <th>Nombre del Convenio:</th>
            <td colspan="3">{{ $plan['nombre_convenio'] ?? $p->empresa }}</td>
        </tr>
        <tr>
            <th>Duración:</th>
            <td>{{ $plan['duracion'] ?? '384 Horas (4 meses)' }}</td>
            <th>Tipo de Convenio:</th>
            <td>{{ $plan['tipo_convenio'] ?? 'Práctica Profesional' }}</td>
        </tr>
        <tr>
            <th>Fecha de Registro:</th>
            <td colspan="3">
                Año: {{ $plan['fecha_anio'] ?? date('Y') }} &nbsp;|&nbsp; 
                Mes: {{ $plan['fecha_mes'] ?? date('m') }} &nbsp;|&nbsp; 
                Día: {{ $plan['fecha_dia'] ?? date('d') }}
            </td>
        </tr>
    </table>

    <!-- Responsables del Convenio -->
    <div class="section-header">2. Responsables del Convenio</div>
    <table class="info-table">
        <tr>
            <th colspan="4" style="background-color: #f1f5f9; text-align: center; font-weight: bold; color: #0f172a;">
                Por la Fundación Escuela Tecnológica FET (Asesor de Práctica)
            </th>
        </tr>
        <tr>
            <th>Nombre completo:</th>
            <td>{{ $responsables['fet_nombre'] ?? $p->tutor_nombre }}</td>
            <th>E-mail:</th>
            <td>{{ $responsables['fet_email'] ?? $p->tutor_email }}</td>
        </tr>
        <tr>
            <th>Cargo:</th>
            <td>{{ $responsables['fet_cargo'] ?? 'Docente Tutor Académico' }}</td>
            <th>No. Telefónico:</th>
            <td>{{ $responsables['fet_telefono'] ?? '—' }}</td>
        </tr>
        <tr>
            <th colspan="4" style="background-color: #f1f5f9; text-align: center; font-weight: bold; color: #0f172a;">
                Por la Entidad en Convenio (Supervisor-Cooperador de la Empresa)
            </th>
        </tr>
        <tr>
            <th>Nombre completo:</th>
            <td>{{ $responsables['emp_nombre'] ?? $p->supervisor_empresa }}</td>
            <th>E-mail:</th>
            <td>{{ $responsables['emp_email'] ?? $p->contacto_empresa }}</td>
        </tr>
        <tr>
            <th>Cargo:</th>
            <td>{{ $responsables['emp_cargo'] ?? 'Supervisor de Práctica' }}</td>
            <th>No. Telefónico:</th>
            <td>{{ $responsables['emp_telefono'] ?? $p->telefono_supervisor }}</td>
        </tr>
    </table>

    <!-- Datos del Estudiante -->
    <div class="section-header">3. Datos del Estudiante</div>
    <table class="info-table">
        <tr>
            <th>Nombre Completo:</th>
            <td>{{ $p->estudiante_nombre }}</td>
            <th>Identificación:</th>
            <td>{{ $p->estudiante_documento }}</td>
        </tr>
        <tr>
            <th>Código Estudiantil:</th>
            <td>{{ $p->codigo_estudiante }}</td>
            <th>Programa Académico:</th>
            <td>{{ $plan['estudiante_programa'] ?? 'Ingeniería / Tecnología de Software' }}</td>
        </tr>
    </table>

    <!-- Planificación de Actividades -->
    <div class="section-header">4. Planificación de Actividades y Competencias</div>
    <table class="activities-table">
        <thead>
            <tr>
                <th style="width: 30%;">Competencia a desarrollar</th>
                <th style="width: 50%;">Actividad específica a realizar</th>
                <th style="width: 20%; text-align: center;">Fecha de ejecución</th>
            </tr>
        </thead>
        <tbody>
            @if(!empty($actividades) && is_array($actividades))
                @foreach($actividades as $act)
                    <tr>
                        <td>{{ $act['competencia'] ?? '' }}</td>
                        <td>{{ $act['actividad'] ?? '' }}</td>
                        <td style="text-align: center;">{{ $act['fecha'] ?? '' }}</td>
                    </tr>
                @endforeach
            @else
                <tr>
                    <td>Habilidades de análisis y diseño de software.</td>
                    <td>Levantamiento de requerimientos y análisis del sistema de información empresarial.</td>
                    <td style="text-align: center;">Semana 1 - 2</td>
                </tr>
                <tr>
                    <td>Desarrollo y codificación de software.</td>
                    <td>Construcción de módulos del frontend y bases de datos según diseño acordado.</td>
                    <td style="text-align: center;">Semana 3 - 10</td>
                </tr>
                <tr>
                    <td>Pruebas y aseguramiento de calidad de software.</td>
                    <td>Ejecución de pruebas unitarias, integración y depuración de errores detectados.</td>
                    <td style="text-align: center;">Semana 11 - 14</td>
                </tr>
                <tr>
                    <td>Soporte y documentación técnica.</td>
                    <td>Redacción del manual de usuario, manual técnico e informe final de la práctica.</td>
                    <td style="text-align: center;">Semana 15 - 16</td>
                </tr>
            @endif
        </tbody>
    </table>

    <!-- Firmas de Aprobación -->
    <table class="signatures-container">
        <tr>
            <td>
                <div class="signature-line">
                    @if($p->estudiante_firma)
                        <img class="signature-img" src="{{ asset('uploads/pasantias/firmas/' . $p->estudiante_firma) }}" alt="Firma Estudiante">
                    @else
                        <span style="color: #94a3b8; font-size: 8pt;">Pendiente Firma</span>
                    @endif
                </div>
                <div class="signer-name">{{ $p->estudiante_nombre }}</div>
                <div class="signer-role">Elaborado por: Pasante</div>
            </td>
            <td>
                <div class="signature-line">
                    @if($p->tutor_firma)
                        <img class="signature-img" src="{{ asset('uploads/pasantias/firmas/' . $p->tutor_firma) }}" alt="Firma Tutor">
                    @else
                        <span style="color: #94a3b8; font-size: 8pt;">Pendiente Firma</span>
                    @endif
                </div>
                <div class="signer-name">{{ $p->tutor_nombre ?: 'Juan Gabriel Carvajal Vega' }}</div>
                <div class="signer-role">Revisado por: Asesor de Práctica FET</div>
            </td>
            <td>
                <div class="signature-line">
                    @if($p->firma_supervisor)
                        <img class="signature-img" src="{{ asset('uploads/pasantias/firmas/' . $p->firma_supervisor) }}" alt="Firma Supervisor">
                    @else
                        <span style="color: #94a3b8; font-size: 8pt;">Pendiente Firma</span>
                    @endif
                </div>
                <div class="signer-name">{{ $responsables['emp_nombre'] ?? $p->supervisor_empresa ?: '___________________' }}</div>
                <div class="signer-role">Aprobado por: Supervisor de la Entidad</div>
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
