<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Plan de Trabajo - {{ $p->estudiante_nombre }}</title>
    <style type="text/css">
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #fff;
            color: #000;
        }
        p {
            margin-top: 0pt;
            margin-bottom: 0pt;
            line-height: 115%;
        }
        .no-print {
            margin-bottom: 20px;
            text-align: right;
        }
        .print-btn {
            background-color: #00b050;
            color: white;
            border: none;
            padding: 8px 16px;
            font-size: 10pt;
            font-weight: bold;
            border-radius: 4px;
            cursor: pointer;
        }
        .print-btn:hover {
            background-color: #008f3c;
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
        .value-text {
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
        <div style="clear:both;">
            <div style="text-align:center;">
                <table cellspacing="0" cellpadding="0" style="width:100%; border:0.75pt solid #000000; border-collapse:collapse;">
                    <tbody>
                        <tr style="height:39.65pt;">
                            <td style="width:20%; border-right:0.75pt solid #000000; padding:5px; vertical-align:middle; text-align:center;">
                                <img src="{{ $url_logofet }}" alt="FET Logo" onerror="this.src='/IMG/logofet.png'" style="max-height:45px; max-width:100%; object-fit:contain;">
                            </td>
                            <td style="width:55%; border-right:0.75pt solid #000000; border-left:0.75pt solid #000000; padding:5px; vertical-align:middle; text-align:center;">
                                <p style="font-size:10pt; font-weight:bold; font-family:Arial; text-transform:uppercase; margin:0;">
                                    PLAN DE TRABAJO DE CONVENIO DE PRÁCTICA
                                </p>
                            </td>
                            <td style="width:25%; border-left:0.75pt solid #000000; padding:5px; vertical-align:middle; line-height:1.2; font-size:8pt; font-family:'Times New Roman'; font-weight:bold;">
                                <p>Código: PM-PSO-F-002</p>
                                <p>Versión: 01</p>
                                <p>Fecha: Enero/2018</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p style="margin-top:5pt; margin-bottom:5pt;">&nbsp;</p>
        </div>

        @php
            $dt = isset($p->created_at) ? \Carbon\Carbon::parse($p->created_at) : now();
            $anio = $plan['fecha_anio'] ?? $dt->format('Y');
            $mes = $plan['fecha_mes'] ?? $dt->format('m');
            $dia = $plan['fecha_dia'] ?? $dt->format('d');
        @endphp

        <table cellspacing="0" cellpadding="0" style="width:120pt; border:0.75pt solid #000000; border-collapse:collapse; margin-bottom:10px;">
            <tbody>
                <tr style="height:19.35pt;">
                    <td colspan="3" style="border-bottom:0.75pt solid #000000; padding:3px; vertical-align:middle; background-color:#00b050;">
                        <p style="text-align:center; font-size:9pt; font-family:'Times New Roman'; font-weight:bold; color:#fff;">Fecha</p>
                    </td>
                </tr>
                <tr style="height:19.35pt;">
                    <td style="border-right:0.75pt solid #000000; border-bottom:0.75pt solid #000000; padding:3px; vertical-align:middle; background-color:#00b050; text-align:center; color:#fff; font-size:9pt; font-family:'Times New Roman'; font-weight:bold;">Año</td>
                    <td style="border-right:0.75pt solid #000000; border-left:0.75pt solid #000000; border-bottom:0.75pt solid #000000; padding:3px; vertical-align:middle; background-color:#00b050; text-align:center; color:#fff; font-size:9pt; font-family:'Times New Roman'; font-weight:bold;">Mes</td>
                    <td style="border-left:0.75pt solid #000000; border-bottom:0.75pt solid #000000; padding:3px; vertical-align:middle; background-color:#00b050; text-align:center; color:#fff; font-size:9pt; font-family:'Times New Roman'; font-weight:bold;">Día</td>
                </tr>
                <tr style="height:17.5pt;">
                    <td style="border-right:0.75pt solid #000000; padding:3px; vertical-align:middle; text-align:center; font-size:9pt; font-family:'Times New Roman'; font-weight:bold;">{{ $anio }}</td>
                    <td style="border-right:0.75pt solid #000000; border-left:0.75pt solid #000000; padding:3px; vertical-align:middle; text-align:center; font-size:9pt; font-family:'Times New Roman'; font-weight:bold;">{{ $mes }}</td>
                    <td style="border-left:0.75pt solid #000000; padding:3px; vertical-align:middle; text-align:center; font-size:9pt; font-family:'Times New Roman'; font-weight:bold;">{{ $dia }}</td>
                </tr>
            </tbody>
        </table>

        <table cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; margin-bottom:10px;">
            <tbody>
                <tr style="height:18pt;">
                    <td style="padding:5px; vertical-align:middle; background-color:#00b050; text-align:center; border:0.75pt solid #000000;">
                        <p style="font-size:10pt; font-family:'Times New Roman'; font-weight:bold; color:#fff;">DATOS DEL CONVENIO</p>
                    </td>
                </tr>
            </tbody>
        </table>

        <div style="font-size:9.5pt; font-family:Arial; line-height:1.6; margin-bottom:15px;">
            <p style="margin-bottom:8px;">
                <strong>Nombre del Convenio:</strong> 
                <span class="value-text" style="width:75%;">{{ $plan['nombre_convenio'] ?? $p->empresa }}</span>
            </p>
            <p style="margin-bottom:8px;">
                <strong>Duración:</strong> 
                <span class="value-text" style="width:30%;">{{ $plan['duracion'] ?? '384 Horas (4 meses)' }}</span>
            </p>

            @php
                $tipo = strtolower($plan['tipo_convenio'] ?? 'práctica');
                $isPractica = (str_contains($tipo, 'práct') || str_contains($tipo, 'pract')) ? '[X]' : '[&nbsp;&nbsp;]';
                $isMarco = (str_contains($tipo, 'marco') || str_contains($tipo, 'cooper')) ? '[X]' : '[&nbsp;&nbsp;]';
                $isOtro = ($isPractica === '[&nbsp;&nbsp;]' && $isMarco === '[&nbsp;&nbsp;]') ? '[X]' : '[&nbsp;&nbsp;]';
                $otroNombre = $isOtro === '[X]' ? ($plan['tipo_convenio'] ?? '') : '________________________________';
            @endphp

            <p style="margin-bottom:8px;">
                <strong>Tipo de convenio:</strong> &nbsp;&nbsp;&nbsp;&nbsp;
                <span style="font-weight:bold; font-family:monospace;">{!! $isPractica !!}</span> Práctica &nbsp;&nbsp;&nbsp;&nbsp;
                <span style="font-weight:bold; font-family:monospace;">{!! $isMarco !!}</span> Marco de Cooperación &nbsp;&nbsp;&nbsp;&nbsp;
                <span style="font-weight:bold; font-family:monospace;">{!! $isOtro !!}</span> Otro &iquest;Cuál? 
                <span class="value-text" style="width:30%;">{{ $otroNombre }}</span>
            </p>
        </div>

        <table cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; margin-bottom:10px;">
            <tbody>
                <tr style="height:18pt;">
                    <td style="padding:5px; vertical-align:middle; background-color:#00b050; border:0.75pt solid #000000;">
                        <p style="font-size:10pt; font-family:'Times New Roman'; font-weight:bold; color:#fff; text-transform:uppercase;">RESPONSABLES DEL CONVENIO</p>
                    </td>
                </tr>
            </tbody>
        </table>

        <div style="font-size:9.5pt; font-family:Arial; line-height:1.6; margin-bottom:15px;">
            <p style="margin-bottom:5px;"><strong>Por la Fundación Escuela Tecnológica FET- Asesor de práctica</strong></p>
            <table style="width:100%; margin-bottom:10px; border-collapse:collapse;">
                <tr>
                    <td style="width:33%; padding:3px 0;">Nombre: <span class="value-text" style="width:70%;">{{ $responsables['fet_nombre'] ?? $p->tutor_nombre }}</span></td>
                    <td style="width:33%; padding:3px 0;">Cargo: <span class="value-text" style="width:70%;">{{ $responsables['fet_cargo'] ?? 'Docente Tutor Académico' }}</span></td>
                    <td style="width:34%; padding:3px 0;">No. Telefónico: <span class="value-text" style="width:65%;">{{ $responsables['fet_telefono'] ?? $p->tutor_telefono ?: '—' }}</span></td>
                </tr>
                <tr>
                    <td colspan="3" style="padding:3px 0;">Correo electrónico: <span class="value-text" style="width:80%;">{{ $responsables['fet_email'] ?? $p->tutor_email }}</span></td>
                </tr>
            </table>

            <p style="margin-bottom:5px;"><strong>Por la Entidad en convenio (supervisor-cooperador)</strong></p>
            <table style="width:100%; margin-bottom:10px; border-collapse:collapse;">
                <tr>
                    <td style="width:33%; padding:3px 0;">Nombre: <span class="value-text" style="width:70%;">{{ $responsables['emp_nombre'] ?? $p->supervisor_empresa }}</span></td>
                    <td style="width:33%; padding:3px 0;">Cargo: <span class="value-text" style="width:70%;">{{ $responsables['emp_cargo'] ?? 'Supervisor de Práctica' }}</span></td>
                    <td style="width:34%; padding:3px 0;">No. Telefónico: <span class="value-text" style="width:65%;">{{ $responsables['emp_telefono'] ?? $p->telefono_supervisor ?: '—' }}</span></td>
                </tr>
                <tr>
                    <td colspan="3" style="padding:3px 0;">Correo electrónico: <span class="value-text" style="width:80%;">{{ $responsables['emp_email'] ?? $p->contacto_empresa ?: '—' }}</span></td>
                </tr>
            </table>

            <p style="margin-bottom:5px;"><strong>Estudiante</strong></p>
            <table style="width:100%; border-collapse:collapse;">
                <tr>
                    <td style="width:50%; padding:3px 0;">Nombre: <span class="value-text" style="width:80%;">{{ $p->estudiante_nombre }}</span></td>
                    <td style="width:50%; padding:3px 0;">Identificación: <span class="value-text" style="width:70%;">{{ $p->estudiante_documento }}</span></td>
                </tr>
                <tr>
                    <td colspan="2" style="padding:3px 0;">Programa: <span class="value-text" style="width:80%;">{{ $plan['estudiante_programa'] ?? 'Ingeniería / Tecnología de Software' }}</span></td>
                </tr>
            </table>
        </div>

        <table cellspacing="0" cellpadding="0" style="width:100%; border:0.75pt solid #000000; border-collapse:collapse; margin-top:20px;">
            <tbody>
                <tr style="height:25.5pt; background-color:#00b050;">
                    <td style="width:40%; border-right:0.75pt solid #000000; border-bottom:0.75pt solid #000000; padding:5px; vertical-align:middle; text-align:center; color:#fff;">
                        <p style="font-size:9.5pt; font-family:'Times New Roman'; font-weight:bold;">COMPETENCIA</p>
                    </td>
                    <td style="width:40%; border-right:0.75pt solid #000000; border-left:0.75pt solid #000000; border-bottom:0.75pt solid #000000; padding:5px; vertical-align:middle; text-align:center; color:#fff;">
                        <p style="font-size:9.5pt; font-family:'Times New Roman'; font-weight:bold;">ACTIVIDAD</p>
                    </td>
                    <td style="width:20%; border-left:0.75pt solid #000000; border-bottom:0.75pt solid #000000; padding:5px; vertical-align:middle; text-align:center; color:#fff;">
                        <p style="font-size:9.5pt; font-family:'Times New Roman'; font-weight:bold;">FECHA</p>
                    </td>
                </tr>

                @if(!empty($actividades) && is_array($actividades))
                    @foreach($actividades as $act)
                        <tr>
                            <td style="border-right:0.75pt solid #000000; border-bottom:0.75pt solid #000000; padding:6px; font-size:9pt; font-family:'Times New Roman'; vertical-align:top;">
                                {{ $act['competencia'] ?? '' }}
                            </td>
                            <td style="border-right:0.75pt solid #000000; border-left:0.75pt solid #000000; border-bottom:0.75pt solid #000000; padding:6px; font-size:9pt; font-family:'Times New Roman'; vertical-align:top;">
                                {{ $act['actividad'] ?? '' }}
                            </td>
                            <td style="border-left:0.75pt solid #000000; border-bottom:0.75pt solid #000000; padding:6px; font-size:9pt; font-family:'Times New Roman'; text-align:center; vertical-align:top;">
                                {{ $act['fecha'] ?? '' }}
                            </td>
                        </tr>
                    @endforeach
                @else
                    @for($i = 0; $i < 4; $i++)
                        <tr>
                            <td style="border-right:0.75pt solid #000000; border-bottom:0.75pt solid #000000; padding:10px; font-size:9pt; font-family:'Times New Roman';">&nbsp;</td>
                            <td style="border-right:0.75pt solid #000000; border-left:0.75pt solid #000000; border-bottom:0.75pt solid #000000; padding:10px; font-size:9pt; font-family:'Times New Roman';">&nbsp;</td>
                            <td style="border-left:0.75pt solid #000000; border-bottom:0.75pt solid #000000; padding:10px; font-size:9pt; font-family:'Times New Roman';">&nbsp;</td>
                        </tr>
                    @endfor
                @endif
            </tbody>
        </table>

        <p style="margin-top:15pt; margin-bottom:5pt; font-size:9.5pt; font-family:Arial;"><strong>Participantes de la elaboración</strong></p>
        <p style="text-align:justify; font-size:9pt; font-family:Arial; line-height:1.3; margin-bottom:15px;">
            Los aquí firmantes, damos fe que en una mesa de trabajo se planteó de común acuerdo las actividades aquí programadas y nos comprometemos a facilitar los recursos humanos, técnicos, físicos o financieros, según se haya acordado para el cumplimiento del plan de trabajo establecido.
        </p>

        <!-- Firmas Dinámicas con Imágenes Reales -->
        <table cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; margin-top:20px; margin-bottom:20px;">
            <tr>
                <td style="width:33%; text-align:center; padding: 10px; border:none; vertical-align:bottom;">
                    <div style="height: 65px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #000; margin-bottom: 5px; width:85%; margin-left:auto; margin-right:auto;">
                        @if($p->estudiante_firma)
                            <img src="{{ asset('uploads/pasantias/firmas/' . $p->estudiante_firma) }}" style="max-height: 55px; max-width: 100%; object-fit: contain;">
                        @else
                            <span style="color:#94a3b8; font-size:8pt;">Pendiente Firma</span>
                        @endif
                    </div>
                    <div style="font-weight:bold; font-size:8.5pt; font-family:Arial;">{{ $p->estudiante_nombre }}</div>
                    <div style="font-size:7.5pt; color:#64748b; font-family:Arial;">Pasante (Estudiante)</div>
                </td>
                <td style="width:33%; text-align:center; padding: 10px; border:none; vertical-align:bottom;">
                    <div style="height: 65px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #000; margin-bottom: 5px; width:85%; margin-left:auto; margin-right:auto;">
                        @if($p->tutor_firma)
                            <img src="{{ asset('uploads/pasantias/firmas/' . $p->tutor_firma) }}" style="max-height: 55px; max-width: 100%; object-fit: contain;">
                        @else
                            <span style="color:#94a3b8; font-size:8pt;">Pendiente Firma</span>
                        @endif
                    </div>
                    <div style="font-weight:bold; font-size:8.5pt; font-family:Arial;">{{ $p->tutor_nombre ?: 'Juan Gabriel Carvajal Vega' }}</div>
                    <div style="font-size:7.5pt; color:#64748b; font-family:Arial;">Asesor de Práctica (Tutor FET)</div>
                </td>
                <td style="width:33%; text-align:center; padding: 10px; border:none; vertical-align:bottom;">
                    <div style="height: 65px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #000; margin-bottom: 5px; width:85%; margin-left:auto; margin-right:auto;">
                        @if($p->firma_supervisor)
                            <img src="{{ asset('uploads/pasantias/firmas/' . $p->firma_supervisor) }}" style="max-height: 55px; max-width: 100%; object-fit: contain;">
                        @else
                            <span style="color:#94a3b8; font-size:8pt;">Pendiente Firma</span>
                        @endif
                    </div>
                    <div style="font-weight:bold; font-size:8.5pt; font-family:Arial;">{{ $responsables['emp_nombre'] ?? $p->supervisor_empresa ?: '___________________' }}</div>
                    <div style="font-size:7.5pt; color:#64748b; font-family:Arial;">Supervisor de la Entidad</div>
                </td>
            </tr>
        </table>

        <!-- Tabla Aprobaciones Consejo -->
        <table cellspacing="0" cellpadding="0" style="width:100%; border:0.75pt solid #000000; border-collapse:collapse; margin-top:20px;">
            <tbody>
                <tr style="height:53.25pt;">
                    <td style="width:33.3%; border-right:0.75pt solid #000000; padding:6px; vertical-align:top;">
                        <p style="text-align:justify; font-size:6.5pt; font-family:Arial; font-weight:bold; text-transform:uppercase;">Revisó y aprobó:</p>
                        <p style="text-align:justify; font-size:6.5pt; font-family:Arial;">&nbsp;</p>
                        <p style="text-align:justify; font-size:6.5pt; font-family:Arial; font-weight:bold; margin-top:20px;">CONSEJO ACADÉMICO</p>
                        <p style="text-align:justify; font-size:6.5pt; font-family:Arial; font-weight:bold; color:#00b050;">HECHO</p>
                    </td>
                    <td style="width:33.3%; border-right:0.75pt solid #000000; border-left:0.75pt solid #000000; padding:6px; vertical-align:top;">
                        <p style="text-align:justify; font-size:6.5pt; font-family:Arial; font-weight:bold; text-transform:uppercase;">Revisó:</p>
                        <p style="text-align:justify; font-size:6.5pt; font-family:Arial;">&nbsp;</p>
                        <p style="text-align:justify; font-size:6.5pt; font-family:Arial; font-weight:bold; margin-top:20px;">JUAN JAIRO TRUJILLO QUINTERO</p>
                        <p style="text-align:justify; font-size:6.5pt; font-family:Arial;">Asesor Jurídico</p>
                        <p style="text-align:justify; font-size:6.5pt; font-family:Arial; font-weight:bold; color:#00b050;">HECHO</p>
                    </td>
                    <td style="width:33.4%; border-left:0.75pt solid #000000; padding:6px; vertical-align:top;">
                        <p style="text-align:justify; font-size:6.5pt; font-family:Arial; font-weight:bold; text-transform:uppercase;">Elaboró y Aprobó:</p>
                        <p style="text-align:justify; font-size:6.5pt; font-family:Arial;">&nbsp;</p>
                        <p style="text-align:justify; font-size:6.5pt; font-family:Arial; font-weight:bold; margin-top:20px;">COMITÉ DE PROYECCIÓN SOCIAL Y EXT.</p>
                        <p style="text-align:justify; font-size:6.5pt; font-family:Arial; font-weight:bold; color:#00b050;">HECHO</p>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- University Footer Info exactly matching template -->
        <div style="margin-top:20px; font-family:Arial;">
            <p style="text-align:right; font-size:7.5pt; font-weight:bold; font-style:italic; color:#0d0d0d;">
                Sujeta a la Inspección y Vigilancia del MEN. Res. 1595 febrero 28/2011
            </p>
            <p style="text-align:center; font-size:9.5pt; color:#595959; margin-top:5px; font-style:italic;">
                ¡Agregando valor al desarrollo del Huila y el Sur Colombiano!
            </p>
            <p style="text-align:center; font-size:9pt; font-weight:bold; margin-top:3px;">
                Oficina Comercial: Calle 6 Nº 9-06 Barrio Altico
            </p>
            <p style="text-align:center; font-size:9pt; font-weight:bold;">
                Campus Universitario Km. 11 Vía Neiva – Castilla (Neiva - Huila)
            </p>
            <p style="text-align:center; font-size:9pt; font-weight:bold;">
                Teléfonos: 871 3918 - 870 3107 - 318 844 0166 - 318 827 4549 | www.fet.edu.co
            </p>
        </div>
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
