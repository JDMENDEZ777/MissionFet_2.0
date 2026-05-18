<!DOCTYPE html>
<html lang="es">
<head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8"/>
    <title>Acta de Inicio - {{ $p->estudiante_nombre }}</title>
    <style type="text/css">
        @page { 
            size: 8.5in 11in; 
            margin-left: 1.18in; 
            margin-right: 0.98in; 
            margin-top: 0.5in; 
            margin-bottom: 0.5in; 
        }
        body {
            font-family: Arial, sans-serif;
            color: #000;
            margin: 0;
            padding: 0;
            line-height: 1.4;
            background: transparent;
        }
        p {
            direction: ltr;
            margin-bottom: 0.1in;
            widows: 2;
            text-indent: -0in;
            orphans: 2;
            text-align: left;
            line-height: 115%;
            background: transparent;
        }
        .no-print {
            margin-bottom: 15px;
            text-align: right;
        }
        .print-btn {
            background-color: #549e39;
            color: white;
            border: none;
            padding: 8px 16px;
            font-size: 10pt;
            font-weight: bold;
            border-radius: 4px;
            cursor: pointer;
        }
        .print-btn:hover {
            background-color: #3e7a27;
        }
        @media print {
            @page {
                size: auto;
                margin: 0 !important;
            }
            body {
                padding: 15mm 20mm !important;
                margin: 0 !important;
                background-color: #fff;
            }
            .no-print {
                display: none;
            }
        }
        .section-title {
            color: #3e7a27;
            font-size: 11pt;
            font-weight: bold;
            border-bottom: 2px solid #a8d08d;
            padding-bottom: 3px;
            margin-top: 20px;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            margin-bottom: 15px;
            font-size: 9.5pt;
        }
        .meta-table th, .meta-table td {
            border: 1px solid #000000;
            padding: 6px 10px;
            text-align: left;
        }
        .meta-table th {
            background-color: #dbefd3;
            font-weight: bold;
            width: 25%;
        }
        ol {
            padding-left: 20px;
            margin-top: 5px;
            margin-bottom: 15px;
            font-size: 9.5pt;
        }
        li {
            margin-bottom: 6px;
        }
        .desarrollo-box {
            font-size: 9.5pt;
            line-height: 1.5;
            text-align: justify;
        }
        .desarrollo-box p {
            margin-bottom: 8px;
            text-align: justify;
        }
        .value-underline {
            font-weight: bold;
            color: #000;
            border-bottom: 1px dashed #666;
            display: inline-block;
            padding: 0 4px;
        }
    </style>
</head>
<body>

    <div class="print-btn-container no-print">
        <button class="print-btn" onclick="window.print()">Imprimir / Guardar como PDF</button>
    </div>

    <div>
        <!-- LibreOffice custom structured header table -->
        <table width="100%" cellpadding="6" cellspacing="0" style="border: 1px solid #000000; border-collapse: collapse;">
            <tr>
                <td rowspan="3" width="20%" style="border: 1px solid #000000; padding: 6px; text-align: center; vertical-align: middle;">
                    <img src="{{ $url_logofet }}" alt="FET Logo" onerror="this.src='/IMG/logofet.png'" style="max-height: 48px; max-width: 100%; object-fit: contain;">
                </td>
                <td rowspan="3" width="55%" bgcolor="#a8d08d" style="background: #a8d08d; border: 1px solid #000000; padding: 6px; text-align: center; vertical-align: middle;">
                    <p align="center" style="margin: 0; font-family: Arial; font-weight: bold; font-size: 11pt; text-transform: uppercase;">
                        ACTA DE INICIO
                    </p>
                </td>
                <td width="25%" style="border: 1px solid #000000; padding: 6px; font-family: Arial; font-size: 8pt; font-weight: bold; line-height: 1.2;">
                    Código: PE-PCA-F-005
                </td>
            </tr>
            <tr>
                <td style="border: 1px solid #000000; padding: 6px; font-family: Arial; font-size: 8pt; font-weight: bold; line-height: 1.2;">
                    Versión: 1.0
                </td>
            </tr>
            <tr>
                <td style="border: 1px solid #000000; padding: 6px; font-family: Arial; font-size: 8pt; font-weight: bold; line-height: 1.2;">
                    Fecha: 04/04/2019
                </td>
            </tr>
        </table>

        <!-- Metadata de la reunión -->
        <table class="meta-table">
            <tr>
                <th>Proceso o Dependencia:</th>
                <td colspan="3">FET - Fundación Escuela Tecnológica De Neiva "Jesús Oviedo Pérez"</td>
            </tr>
            <tr>
                <th>Fecha:</th>
                <td><span class="value-underline" style="width:85%;">{{ $acta['fecha'] ?? '_____________________' }}</span></td>
                <th>Hora:</th>
                <td><span class="value-underline" style="width:85%;">{{ $acta['hora'] ?? '_____________________' }}</span></td>
            </tr>
            <tr>
                <th>Lugar:</th>
                <td colspan="3"><span class="value-underline" style="width:90%;">{{ $acta['lugar'] ?? 'NEIVA - HUILA' }}</span></td>
            </tr>
            <tr>
                <th>Asunto:</th>
                <td colspan="3"><span class="value-underline" style="width:90%;">{{ $acta['asunto'] ?? 'Iniciación del contrato con la empresa' }}</span></td>
            </tr>
            <tr>
                <th>Asistentes:</th>
                <td colspan="3" style="white-space: pre-line;">{!! nl2br(e($asistentes ?: "Carlos Alberto Mosquera Chavarro (Practicante)\nJuan Pablo Murcia Arias (Docente FET)\nJuan Gabriel Carvajal Vega (Docente FET)")) !!}</td>
            </tr>
        </table>

        <!-- Orden del Día -->
        <div class="section-title">ORDEN DEL DÍA</div>
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
        <div class="section-title">DESARROLLO</div>
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

        <!-- Firmas Dinámicas con Imágenes Reales -->
        <table cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; margin-top:40px; margin-bottom:20px;">
            <tr>
                <td style="width:50%; text-align:center; padding: 15px; border:none; vertical-align:bottom;">
                    <div style="height: 70px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #000; margin-bottom: 5px; width:75%; margin-left:auto; margin-right:auto;">
                        @if($p->estudiante_firma)
                            <img src="{{ asset('uploads/pasantias/firmas/' . $p->estudiante_firma) }}" style="max-height: 60px; max-width: 100%; object-fit: contain;">
                        @else
                            <span style="color:#94a3b8; font-size:8.5pt;">Pendiente Firma</span>
                        @endif
                    </div>
                    <div style="font-weight:bold; font-size:9pt; font-family:Arial;">{{ $p->estudiante_nombre }}</div>
                    <div style="font-size:8pt; color:#64748b; font-family:Arial;">Pasante (Estudiante)</div>
                </td>
                <td style="width:50%; text-align:center; padding: 15px; border:none; vertical-align:bottom;">
                    <div style="height: 70px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #000; margin-bottom: 5px; width:75%; margin-left:auto; margin-right:auto;">
                        @if($p->tutor_firma)
                            <img src="{{ asset('uploads/pasantias/firmas/' . $p->tutor_firma) }}" style="max-height: 60px; max-width: 100%; object-fit: contain;">
                        @else
                            <span style="color:#94a3b8; font-size:8pt;">Pendiente Firma</span>
                        @endif
                    </div>
                    <div style="font-weight:bold; font-size:9pt; font-family:Arial;">{{ $p->tutor_nombre ?: 'Juan Gabriel Carvajal Vega' }}</div>
                    <div style="font-size:8pt; color:#64748b; font-family:Arial;">Asesor de Práctica (Tutor FET)</div>
                </td>
            </tr>
        </table>
    </div>

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 300);
        }
    </script>
</body>
</html>
