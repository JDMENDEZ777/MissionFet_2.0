<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Seguimiento Cuantitativo - {{ $p->estudiante_nombre }}</title>
    <style type="text/css">
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 15px;
            background-color: #fff;
            color: #000;
        }
        p {
            margin-top: 0pt;
            margin-bottom: 0pt;
            line-height: 115%;
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
        <div style="clear:both;">
            <div style="text-align:center;">
                <table cellspacing="0" cellpadding="0" style="width:100%; border:0.75pt solid #ffffff; border-collapse:collapse; background-color:#dbefd3; margin-bottom:10px;">
                    <tbody>
                        <tr style="height:42.05pt;">
                            <td style="width:18%; border-right:0.75pt solid #ffffff; padding:5px; vertical-align:middle; text-align:center;">
                                <img src="{{ $url_logofet }}" alt="FET Logo" onerror="this.src='/IMG/logofet.png'" style="max-height:45px; max-width:100%; object-fit:contain;">
                            </td>
                            <td style="width:57%; border-right:0.75pt solid #ffffff; border-left:0.75pt solid #ffffff; padding:5px; vertical-align:middle; text-align:center;">
                                <p style="font-size:9.5pt; font-weight:bold; font-family:Arial; margin:0; line-height:1.3;">
                                    INFORME DE SEGUIMIENTO CUANTITATIVO A ESTUDIANTES EN PRÁCTICAS PROFESIONALES
                                </p>
                            </td>
                            <td style="width:25%; border-left:0.75pt solid #ffffff; padding:5px; vertical-align:middle; line-height:1.3; font-size:8pt; font-family:Arial; font-weight:bold; text-align:left;">
                                <p>Código: PM-GFO-F-015</p>
                                <p>Versión: 02</p>
                                <p>Fecha: abril/2021</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <h1 style="margin:0 0 15px 0; text-align:center; padding:6px; border:1px solid #549e39; font-size:11pt; background-color:#549e39;">
            <span style="font-family:Arial; font-weight:bold; text-transform:uppercase; color:#ffffff; letter-spacing:0.5pt;">
                EVALUACIÓN CUANTITATIVA DE ESTUDIANTES EN PRÁCTICAS PROFESIONALES
            </span>
        </h1>

        <div style="font-size:9.5pt; font-family:Arial; line-height:1.7; margin-bottom:15px;">
            <table style="width:100%; border-collapse:collapse;">
                <tr>
                    <td style="width:50%; padding:3px 0;"><strong>Agencia de práctica:</strong> <span class="value-underline" style="width:65%;">{{ $p->empresa }}</span></td>
                    <td style="width:50%; padding:3px 0;"><strong>Nombre del Tutor:</strong> <span class="value-underline" style="width:65%;">{{ $p->tutor_nombre }}</span></td>
                </tr>
                <tr>
                    <td style="width:50%; padding:3px 0;"><strong>Nombre del Asesor:</strong> <span class="value-underline" style="width:65%;">{{ $p->supervisor_empresa ?: 'Juan Gabriel Carvajal Vega' }}</span></td>
                    <td style="width:50%; padding:3px 0;"><strong>Nombre del Practicante:</strong> <span class="value-underline" style="width:60%;">{{ $p->estudiante_nombre }}</span></td>
                </tr>
            </table>
        </div>

        <p style="font-size:9.5pt; font-family:Arial; margin-bottom:8px;"><strong>Califique de 1 a 5:</strong></p>
        <p style="font-size:9pt; font-family:Arial; margin-bottom:15px; font-weight:bold; color:#3e7a27;">
            1: Bajo &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2: Regular &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 3: Adecuado &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 4: Bueno &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 5: Excelente
        </p>

        <div style="text-align:center;">
            <table cellspacing="0" cellpadding="0" style="width:100%; border:0.75pt solid #ffffff; border-collapse:collapse; font-size:8pt; font-family:Arial;">
                <tbody>
                    <!-- Headers -->
                    <tr style="height:25pt; background-color:#d1e7a8; font-weight:bold; text-align:center;">
                        <td style="width:30%; border-right:0.75pt solid #ffffff; padding:4px;">
                            <p style="font-size:9pt; margin:0;">ACTITUDINALES</p>
                            <p style="font-size:6.5pt; color:#444; margin:0;">Disposición, reacción, valoración, organización</p>
                        </td>
                        <td style="width:4%; border-right:0.75pt solid #ffffff; padding:2px;">1</td>
                        <td style="width:4%; border-right:0.75pt solid #ffffff; padding:2px;">2</td>
                        <td style="width:28%; border-right:0.75pt solid #ffffff; padding:4px;">
                            <p style="font-size:9pt; margin:0;">PROCEDIMENTAL</p>
                            <p style="font-size:6.5pt; color:#444; margin:0;">Imitación, manipulación, precisión, articulación</p>
                        </td>
                        <td style="width:4%; border-right:0.75pt solid #ffffff; padding:2px;">1</td>
                        <td style="width:4%; border-right:0.75pt solid #ffffff; padding:2px;">2</td>
                        <td style="width:18%; border-right:0.75pt solid #ffffff; padding:4px;">
                            <p style="font-size:9pt; margin:0;">COGNITIVOS</p>
                            <p style="font-size:6.5pt; color:#444; margin:0;">Comprensión, análisis, síntesis</p>
                        </td>
                        <td style="width:4%; border-right:0.75pt solid #ffffff; padding:2px;">1</td>
                        <td style="width:4%; padding:2px;">2</td>
                    </tr>

                    @php
                        // Helper to safely format grades
                        $fmt = function($val) {
                            return $val ? number_format($val, 1) : '';
                        };
                    @endphp

                    <!-- Row 1 -->
                    <tr style="background-color:#dbefd3;">
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Capacidad de cambio y adaptación.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_act_1 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_act_1 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Cumple y desarrolla satisfactoriamente las actividades acordes a su programa.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_proc_1 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_proc_1 ?? null) }}</td>
                        <td colspan="3" style="border:0.75pt solid #ffffff; padding:4px; background-color:#d1e7a8; font-weight:bold; text-align:left;">INFORME DE PRÁCTICA</td>
                    </tr>

                    <!-- Row 2 -->
                    <tr style="background-color:#dbefd3;">
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Manejo adecuado de la comunicación verbal.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_act_2 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_act_2 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">El estudiante se destacó por su liderazgo y comunica ideas.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_proc_2 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_proc_2 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Primera entrega</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_cog_inf_1 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_cog_inf_1 ?? null) }}</td>
                    </tr>

                    <!-- Row 3 -->
                    <tr style="background-color:#dbefd3;">
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Valores, aptitud y actitud proactiva.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_act_3 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_act_3 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Redacción, orden, ortografía y presentación de informes.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_proc_3 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_proc_3 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Entrega informe final</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_cog_inf_2 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_cog_inf_2 ?? null) }}</td>
                    </tr>

                    <!-- Row 4 -->
                    <tr style="background-color:#dbefd3;">
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Creatividad e innovación.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_act_4 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_act_4 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Uso adecuado de comandos verbales dentro de su actividad.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_proc_4 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_proc_4 ?? null) }}</td>
                        <td colspan="3" style="border:0.75pt solid #ffffff; padding:4px; background-color:#d1e7a8; font-weight:bold; text-align:left;">PROYECTO DE INVESTIGACIÓN</td>
                    </tr>

                    <!-- Row 5 -->
                    <tr style="background-color:#dbefd3;">
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Apropiación de su cargo y funciones.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_act_5 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_act_5 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Aplica conocimientos teóricos en su lugar de trabajo.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_proc_5 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_proc_5 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Primera entrega</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_cog_pro_1 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_cog_pro_1 ?? null) }}</td>
                    </tr>

                    <!-- Row 6 -->
                    <tr style="background-color:#dbefd3;">
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Trabajo en equipo y cooperación.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_act_6 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_act_6 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Capacidad de comunicación escrita.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_proc_6 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_proc_6 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Entrega Final</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_cog_pro_2 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_cog_pro_2 ?? null) }}</td>
                    </tr>

                    <!-- Row 7 -->
                    <tr style="background-color:#dbefd3;">
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Manejo de relaciones interpersonales.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_act_7 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_act_7 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Habilidades para liderar procesos.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_proc_7 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_proc_7 ?? null) }}</td>
                        <td colspan="3" style="border:0.75pt solid #ffffff; padding:4px; background-color:#d1e7a8; font-weight:bold; text-align:left;">DOMINIO DE CONOCIMIENTOS</td>
                    </tr>

                    <!-- Row 8 -->
                    <tr style="background-color:#dbefd3;">
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Respeto a directivos y grupo de trabajo.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_act_8 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_act_8 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Coordina actividades propias de su campo de acción.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_proc_8 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_proc_8 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Revisiones de tema</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_cog_dom_1 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_cog_dom_1 ?? null) }}</td>
                    </tr>

                    <!-- Row 9 -->
                    <tr style="background-color:#dbefd3;">
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Puntualidad y cumplimiento de tareas asignadas.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_act_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_act_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Organiza, maneja recursos y gestiona el proyecto.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_proc_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_proc_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Estudios de caso</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_cog_dom_2 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_cog_dom_2 ?? null) }}</td>
                    </tr>

                    <!-- Additional Rows matching provided design layout -->
                    <tr style="background-color:#dbefd3;">
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Respeto por la cultura organizacional de la empresa.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_act_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_act_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Capacidad para desarrollar actividades en equipo.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_proc_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_proc_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Controles de lectura</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_cog_dom_1 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_cog_dom_1 ?? null) }}</td>
                    </tr>

                    <tr style="background-color:#dbefd3;">
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Asistencia puntual al campo de práctica.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_act_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_act_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Realiza de manera autónoma tareas relacionadas.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_proc_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_proc_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Otros</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_cog_dom_2 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_cog_dom_2 ?? null) }}</td>
                    </tr>

                    <tr style="background-color:#dbefd3;">
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Presentación personal acorde a las funciones.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_act_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_act_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Conocimiento de su cargo y funciones a desempeñar.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_proc_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_proc_9 ?? null) }}</td>
                        <td colspan="3" style="border:0.75pt solid #ffffff; padding:4px; background-color:#d1e7a8; font-weight:bold; text-align:left;">ACTIVIDADES ADMINISTRATIVAS</td>
                    </tr>

                    <tr style="background-color:#dbefd3;">
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Actitud de servicio.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_act_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_act_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Habilidad para solucionar problemas y gestionarlos.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_proc_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_proc_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">&nbsp;</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">&nbsp;</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">&nbsp;</td>
                    </tr>

                    <tr style="background-color:#dbefd3;">
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Manejo ético de la información.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_act_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_act_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Ejercicio autónomo de actividades profesionales.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_proc_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_proc_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">&nbsp;</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">&nbsp;</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">&nbsp;</td>
                    </tr>

                    <tr style="background-color:#dbefd3;">
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">Receptividad a sugerencias y observaciones.</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval1->nota_act_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">{{ $fmt($eval2->nota_act_9 ?? null) }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">&nbsp;</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">&nbsp;</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">&nbsp;</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">&nbsp;</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">&nbsp;</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; font-weight:bold; text-align:center;">&nbsp;</td>
                    </tr>

                    <!-- Total Rows -->
                    <tr style="background-color:#dbefd3; font-weight:bold; height:20pt;">
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:center;">TOTAL 25%</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; text-align:center;">{{ $eval1 ? number_format($eval1->promedio_actitudinal, 2) : '' }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; text-align:center;">{{ $eval2 ? number_format($eval2->promedio_actitudinal, 2) : '' }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:center;">TOTAL 35%</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; text-align:center;">{{ $eval1 ? number_format($eval1->promedio_procedimental, 2) : '' }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; text-align:center;">{{ $eval2 ? number_format($eval2->promedio_procedimental, 2) : '' }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:center;">TOTAL 40%</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; text-align:center;">{{ $eval1 ? number_format($eval1->promedio_cognitivo, 2) : '' }}</td>
                        <td style="border:0.75pt solid #ffffff; padding:2px; text-align:center;">{{ $eval2 ? number_format($eval2->promedio_cognitivo, 2) : '' }}</td>
                    </tr>

                    <!-- Final Momento 1 (40%) -->
                    <tr style="background-color:#dbefd3; font-weight:bold; height:20pt;">
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">NOTA PRIMER MOMENTO (40%)</td>
                        <td colspan="8" style="border:0.75pt solid #ffffff; padding:4px; text-align:center; font-size:10pt; color:#15803d;">
                            {{ $eval1 ? number_format($eval1->nota_corte, 2) : '—' }}
                        </td>
                    </tr>

                    <!-- Final Momento 2 (60%) -->
                    <tr style="background-color:#dbefd3; font-weight:bold; height:20pt;">
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">NOTA SEGUNDO MOMENTO (60%)</td>
                        <td colspan="8" style="border:0.75pt solid #ffffff; padding:4px; text-align:center; font-size:10pt; color:#15803d;">
                            {{ $eval2 ? number_format($eval2->nota_corte, 2) : '—' }}
                        </td>
                    </tr>

                    <!-- Final Momento Total -->
                    <tr style="background-color:#d1e7a8; font-weight:bold; height:22pt;">
                        <td style="border:0.75pt solid #ffffff; padding:4px; text-align:left;">NOTA FINAL</td>
                        <td colspan="8" style="border:0.75pt solid #ffffff; padding:4px; text-align:center; font-size:11pt; color:#166534;">
                            @php
                                $notaFinal = $p->nota_final ?: ( ($eval1 && $eval2) ? (($eval1->nota_corte * 0.4) + ($eval2->nota_corte * 0.6)) : null );
                            @endphp
                            {{ $notaFinal ? number_format($notaFinal, 2) : 'Pendiente' }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <p style="margin-top:15pt; margin-bottom:5pt; font-size:9.5pt; font-family:Arial;"><strong>OBSERVACIONES:</strong></p>
        <div style="font-family:Arial; font-size:9pt; text-align:justify; padding:8px; border:1px solid #cbd5e1; border-radius:4px; background-color:#dbefd3; line-height:1.4; margin-bottom:20px; min-height:40px;">
            {{ $eval->comentarios ?: 'Sin observaciones registradas por el tutor.' }}
        </div>

        <!-- Firmas Dinámicas con Imágenes Reales -->
        <table cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; margin-top:30px; margin-bottom:20px;">
            <tr>
                <td style="width:33%; text-align:center; padding: 10px; border:none; vertical-align:bottom;">
                    <div style="height: 65px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #000; margin-bottom: 5px; width:85%; margin-left:auto; margin-right:auto;">
                        @if($p->tutor_firma)
                            <img src="{{ asset('uploads/pasantias/firmas/' . $p->tutor_firma) }}" style="max-height: 55px; max-width: 100%; object-fit: contain;">
                        @else
                            <span style="color:#94a3b8; font-size:8pt;">Pendiente Firma</span>
                        @endif
                    </div>
                    <div style="font-weight:bold; font-size:8.5pt; font-family:Arial;">{{ $p->tutor_nombre }}</div>
                    <div style="font-size:7.5pt; color:#64748b; font-family:Arial;">Tutor Académico</div>
                </td>
                <td style="width:33%; text-align:center; padding: 10px; border:none; vertical-align:bottom;">
                    <div style="height: 65px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #000; margin-bottom: 5px; width:85%; margin-left:auto; margin-right:auto;">
                        @if($p->firma_supervisor)
                            <img src="{{ asset('uploads/pasantias/firmas/' . $p->firma_supervisor) }}" style="max-height: 55px; max-width: 100%; object-fit: contain;">
                        @else
                            <span style="color:#94a3b8; font-size:8pt;">Pendiente Firma</span>
                        @endif
                    </div>
                    <div style="font-weight:bold; font-size:8.5pt; font-family:Arial;">{{ $p->supervisor_empresa ?: 'Juan Gabriel Carvajal Vega' }}</div>
                    <div style="font-size:7.5pt; color:#64748b; font-family:Arial;">Asesor FET (Empresa)</div>
                </td>
                <td style="width:33%; text-align:center; padding: 10px; border:none; vertical-align:bottom;">
                    <div style="height: 65px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #000; margin-bottom: 5px; width:85%; margin-left:auto; margin-right:auto;">
                        @if($p->estudiante_firma)
                            <img src="{{ asset('uploads/pasantias/firmas/' . $p->estudiante_firma) }}" style="max-height: 55px; max-width: 100%; object-fit: contain;">
                        @else
                            <span style="color:#94a3b8; font-size:8pt;">Pendiente Firma</span>
                        @endif
                    </div>
                    <div style="font-weight:bold; font-size:8.5pt; font-family:Arial;">{{ $p->estudiante_nombre }}</div>
                    <div style="font-size:7.5pt; color:#64748b; font-family:Arial;">Profesional en Formación (Pasante)</div>
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
