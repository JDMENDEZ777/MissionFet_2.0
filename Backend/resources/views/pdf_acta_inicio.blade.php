<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Acta de Inicio - {{ $p->estudiante_nombre }}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #1e293b;
            margin: 0;
            padding: 20px;
            background-color: #fff;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .header-table td {
            border: 1px solid #94a3b8;
            padding: 10px;
            vertical-align: middle;
            text-align: center;
        }
        .header-logo img {
            max-height: 50px;
        }
        .header-title {
            font-weight: bold;
            font-size: 14pt;
            color: #0f172a;
        }
        .header-meta {
            font-size: 8pt;
            text-align: left !important;
            color: #475569;
        }
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .meta-table th, .meta-table td {
            border: 1px solid #cbd5e1;
            padding: 8px 12px;
            text-align: left;
        }
        .meta-table th {
            background-color: #f1f5f9;
            font-weight: bold;
            width: 20%;
            color: #334155;
        }
        h3, h4 {
            color: #0f172a;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 4px;
            margin-top: 25px;
            margin-bottom: 10px;
        }
        ol {
            padding-left: 20px;
            margin-bottom: 20px;
        }
        li {
            margin-bottom: 8px;
        }
        .desarrollo-box {
            text-align: justify;
            white-space: pre-line;
            line-height: 1.6;
        }
        .signatures-container {
            margin-top: 50px;
            width: 100%;
            border-collapse: collapse;
        }
        .signatures-container td {
            width: 50%;
            text-align: center;
            vertical-align: bottom;
            padding: 20px;
            border: none;
        }
        .signature-line {
            width: 80%;
            margin: 0 auto 10px auto;
            border-bottom: 1px solid #475569;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .signature-img {
            max-height: 70px;
            max-width: 180px;
            object-fit: contain;
        }
        .signer-name {
            font-weight: bold;
            margin: 5px 0 2px 0;
            color: #0f172a;
        }
        .signer-role {
            font-size: 9pt;
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
            margin-bottom: 20px;
            text-align: right;
        }
        .print-btn {
            background-color: #0284c7;
            color: white;
            border: none;
            padding: 8px 16px;
            font-size: 10pt;
            font-weight: bold;
            border-radius: 4px;
            cursor: pointer;
        }
        .print-btn:hover {
            background-color: #0369a1;
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
                ACTA DE INICIO
            </td>
            <td style="width: 25%;" class="header-meta">
                <strong>Código:</strong> PE-PCA-F-005<br>
                <strong>Versión:</strong> 1.0<br>
                <strong>Página:</strong> 1 de 1<br>
                <strong>Fecha:</strong> 04/04/2019
            </td>
        </tr>
    </table>

    <!-- Metadatos de la reunión -->
    <table class="meta-table">
        <tr>
            <th>Proceso o Dependencia:</th>
            <td colspan="3">FET - Fundación Escuela Tecnológica De Neiva "Jesús Oviedo Pérez"</td>
        </tr>
        <tr>
            <th>Fecha:</th>
            <td>{{ $acta['fecha'] ?? '_____________________' }}</td>
            <th>Hora:</th>
            <td>{{ $acta['hora'] ?? '_____________________' }}</td>
        </tr>
        <tr>
            <th>Lugar:</th>
            <td colspan="3">{{ $acta['lugar'] ?? 'NEIVA - HUILA' }}</td>
        </tr>
        <tr>
            <th>Asunto:</th>
            <td colspan="3">{{ $acta['asunto'] ?? 'Iniciación del contrato con la empresa' }}</td>
        </tr>
        <tr>
            <th>Asistentes:</th>
            <td colspan="3" style="white-space: pre-line;">{!! nl2br(e($asistentes ?: "Carlos Alberto Mosquera Chavarro (Practicante)\nJuan Pablo Murcia Arias (Docente FET)\nJuan Gabriel Carvajal Vega (Docente FET)")) !!}</td>
        </tr>
    </table>

    <!-- Orden del Día -->
    <h3>ORDEN DEL DÍA</h3>
    <ol>
        @if(!empty($orden_dia) && is_array($orden_dia))
            @foreach($orden_dia as $item)
                <li>{{ $item }}</li>
            @endforeach
        @else
            <li>Saludo</li>
            <li>Lectura del contrato</li>
            <li>Recomendaciones de la empresa</li>
            <li>Determinar el objetivo de la práctica y el nombre del producto a entregar</li>
            <li>Indicaciones para realizar el Plan de trabajo</li>
            <li>Proposiciones y varios</li>
            <li>Aprobación y firma de los interesados</li>
        @endif
    </ol>

    <!-- Desarrollo -->
    <h3>DESARROLLO</h3>
    <div class="desarrollo-box">
        @if(!empty($desarrollo) && is_array($desarrollo))
            @foreach($desarrollo as $index => $item)
                <p><strong>{{ $index + 1 }}.</strong> {{ $item }}</p>
            @endforeach
        @else
            <p><strong>1. Verificación del orden del día y saludo:</strong> Se procede a saludar y dar la bienvenida a todos los presentes y asistentes al inicio de la práctica.</p>
            <p><strong>2. Lectura y entrega de documentos:</strong> Se realizó lectura y entrega vía correo electrónico de las cartas de presentación correspondientes al proceso de pasantía.</p>
            <p><strong>3. Recomendaciones:</strong> Se hicieron las respectivas recomendaciones y normas de conducta y seguridad que se tienen dentro de la empresa receptora.</p>
            <p><strong>4. Definición de Objetivos:</strong> Se determinó el objetivo general de la práctica en la empresa: "Desarrollar y ejecutar las actividades de apoyo tecnológico asignadas". El producto a entregar se acordó con el supervisor.</p>
            <p><strong>5. Recomendaciones del plan de trabajo:</strong> Se establecieron las recomendaciones y fechas límites para la entrega y elaboración del plan de trabajo de convenio.</p>
            <p><strong>6. Proposiciones y varios:</strong> Se recalcó la importancia del cumplimiento estricto del horario de 384 horas de práctica profesional y la responsabilidad en el desarrollo de evidencias.</p>
            <p><strong>7. Cierre:</strong> Agotada la agenda, se da por terminada la reunión de inicio, procediendo a firmar de conformidad los interesados.</p>
        @endif
    </div>

    <!-- Firmas -->
    <table class="signatures-container">
        <tr>
            <td>
                <div class="signature-line">
                    @if($p->estudiante_firma)
                        <img class="signature-img" src="{{ asset('uploads/pasantias/firmas/' . $p->estudiante_firma) }}" alt="Firma Estudiante">
                    @else
                        <span style="color: #94a3b8; font-size: 9pt;">Pendiente Firma Estudiante</span>
                    @endif
                </div>
                <div class="signer-name">{{ $p->estudiante_nombre }}</div>
                <div class="signer-role">Cargo: Practicante</div>
            </td>
            <td>
                <div class="signature-line">
                    @if($p->tutor_firma)
                        <img class="signature-img" src="{{ asset('uploads/pasantias/firmas/' . $p->tutor_firma) }}" alt="Firma Tutor">
                    @else
                        <span style="color: #94a3b8; font-size: 9pt;">Pendiente Firma Docente FET</span>
                    @endif
                </div>
                <div class="signer-name">{{ $p->tutor_nombre ?: 'Juan Gabriel Carvajal Vega' }}</div>
                <div class="signer-role">Cargo: Docente FET</div>
            </td>
        </tr>
    </table>

    <script>
        // Auto-abrir diálogo de impresión al cargar
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 300);
        }
    </script>
</body>
</html>
