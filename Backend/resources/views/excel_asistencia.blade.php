<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        .title {
            font-family: Arial, sans-serif;
            font-size: 14pt;
            font-weight: bold;
            text-align: center;
            color: #1b5e20;
        }
        .meta-label {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            font-weight: bold;
            background-color: #e8f5e9;
            color: #2e7d32;
        }
        .meta-val {
            font-family: Arial, sans-serif;
            font-size: 10pt;
        }
        .th-green {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            font-weight: bold;
            background-color: #2e7d32;
            color: #ffffff;
            text-align: center;
            vertical-align: middle;
            border: 1px solid #1b5e20;
        }
        .td-normal {
            font-family: Arial, sans-serif;
            font-size: 9.5pt;
            border: 1px solid #c8e6c9;
            vertical-align: top;
        }
        .td-center {
            font-family: Arial, sans-serif;
            font-size: 9.5pt;
            border: 1px solid #c8e6c9;
            text-align: center;
            vertical-align: middle;
        }
        .total-row {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            font-weight: bold;
            background-color: #c8e6c9;
            color: #1b5e20;
            border: 1px solid #1b5e20;
        }
    </style>
</head>
<body>

    <!-- Título Principal -->
    <table>
        <tr>
            <td colspan="6" class="title" height="40">
                PLANILLA DE SEGUIMIENTO Y CONTROL DE ASISTENCIA - PASANTÍAS FET
            </td>
        </tr>
        <tr>
            <td colspan="6" style="text-align: center; font-size: 9pt; color: #555555;">
                Total Horas Obligatorias: 384 Horas de Práctica Profesional
            </td>
        </tr>
        <tr>
            <td colspan="6" height="15"></td>
        </tr>
    </table>

    <!-- Metadatos de la Pasantía -->
    <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; border: 1px solid #2e7d32;">
        <tr>
            <td class="meta-label">Estudiante Practicante:</td>
            <td colspan="2" class="meta-val">{{ $p->estudiante_nombre }}</td>
            <td class="meta-label">Código Estudiante:</td>
            <td colspan="2" class="meta-val" style="mso-number-format:'\@';">{{ $p->codigo_estudiante }}</td>
        </tr>
        <tr>
            <td class="meta-label">Documento Identidad:</td>
            <td colspan="2" class="meta-val" style="mso-number-format:'\@';">{{ $p->estudiante_documento }}</td>
            <td class="meta-label">Empresa / Convenio:</td>
            <td colspan="2" class="meta-val">{{ $p->empresa }}</td>
        </tr>
        <tr>
            <td class="meta-label">Tutor FET Asignado:</td>
            <td colspan="2" class="meta-val">{{ $p->tutor_nombre }}</td>
            <td class="meta-label">Total Horas Aprobadas:</td>
            <td colspan="2" class="meta-val" style="font-weight: bold; color: #1b5e20;">{{ $total_horas }} / 384 Hs.</td>
        </tr>
    </table>

    <table>
        <tr>
            <td colspan="6" height="20"></td>
        </tr>
    </table>

    <!-- Planilla de Asistencia Semanal -->
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; border: 1px solid #1b5e20;">
        <thead>
            <tr>
                <th class="th-green" style="width: 80px;">Semana</th>
                <th class="th-green" style="width: 110px;">Fecha Inicio</th>
                <th class="th-green" style="width: 110px;">Fecha Fin</th>
                <th class="th-green" style="width: 320px;">Actividad Realizada y Entregada</th>
                <th class="th-green" style="width: 90px;">Horas Realizadas</th>
                <th class="th-green" style="width: 140px;">Estado / Firma Tutor</th>
            </tr>
        </thead>
        <tbody>
            @if($asistencias->count() > 0)
                @foreach($asistencias as $asist)
                    <tr>
                        <td class="td-center" style="font-weight: bold;">Semana {{ $asist->semana }}</td>
                        <td class="td-center">{{ date('d/m/Y', strtotime($asist->fecha_inicio)) }}</td>
                        <td class="td-center">{{ date('d/m/Y', strtotime($asist->fecha_fin)) }}</td>
                        <td class="td-normal" style="white-space: pre-line;">{{ $asist->actividad }}</td>
                        <td class="td-center" style="font-weight: bold;">{{ number_format($asist->horas, 1) }} Hs.</td>
                        <td class="td-center" style="font-weight: bold; color: {{ $asist->estado === 'aprobado' ? '#2e7d32' : ($asist->estado === 'corregir' ? '#d32f2f' : '#f57c00') }};">
                            @if($asist->estado === 'aprobado')
                                APROBADA (Firma Docente)
                            @elseif($asist->estado === 'corregir')
                                CORREGIR / RECHAZADA
                            @else
                                PENDIENTE REVISIÓN
                            @endif
                        </td>
                    </tr>
                @endforeach
            @else
                <tr>
                    <td colspan="6" class="td-center" height="40" style="color: #888888;">
                        Sin reportes de asistencia cargados en esta pasantía.
                    </td>
                </tr>
            @endif
            
            <!-- Fila de Totales -->
            <tr class="total-row">
                <td colspan="4" align="right" style="font-weight: bold; border: 1px solid #1b5e20;">
                    TOTAL HORAS ACUMULADAS APROBADAS:
                </td>
                <td align="center" style="font-weight: bold; border: 1px solid #1b5e20;">
                    {{ number_format($total_horas, 1) }} Hs.
                </td>
                <td align="center" style="font-weight: bold; border: 1px solid #1b5e20;">
                    @if($total_horas >= 384)
                        COMPLETADO (384 hs.)
                    @else
                        {{ number_format(384 - $total_horas, 1) }} Hs. Restantes
                    @endif
                </td>
            </tr>
        </tbody>
    </table>

    <table>
        <tr>
            <td colspan="6" height="30"></td>
        </tr>
    </table>

    <!-- Sección de Firmas al pie -->
    <table>
        <tr>
            <td colspan="2" style="text-align: center; font-family: Arial; font-size: 9pt; border-top: 1px solid #777777;">
                _____________________________<br>
                <strong>{{ $p->estudiante_nombre }}</strong><br>
                Pasante Practicante
            </td>
            <td colspan="2"></td>
            <td colspan="2" style="text-align: center; font-family: Arial; font-size: 9pt; border-top: 1px solid #777777;">
                _____________________________<br>
                <strong>{{ $p->tutor_nombre }}</strong><br>
                Tutor Académico FET
            </td>
        </tr>
    </table>

</body>
</html>
