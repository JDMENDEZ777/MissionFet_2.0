<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TutorPasantiasController extends Controller
{
    private function getTutorId(Request $request)
    {
        return $request->user()->id;
    }

    // GET /api/tutor/pasantias
    public function index(Request $request)
    {
        $tutor_id = $this->getTutorId($request);

        // Listar pasantías asignadas al tutor
        $pasantias = DB::table('pasantias as p')
            ->leftJoin('users as e', 'p.estudiante_id', '=', 'e.id')
            ->where('p.tutor_id', $tutor_id)
            ->select(
                'p.*',
                'e.name as estudiante_nombre',
                'e.email as estudiante_email',
                'e.codigo_estudiante',
                'e.documento as estudiante_documento',
                'e.ciclo'
            )
            ->orderBy('p.id', 'desc')
            ->get();

        // Enriquecer pasantías con sumatoria de horas aprobadas y estado del acta
        $pasantias = $pasantias->map(function ($p) {
            $p->horas_aprobadas = DB::table('pasantia_asistencias')
                ->where('pasantia_id', $p->id)
                ->where('estado', 'aprobado')
                ->sum('horas') ?: 0;

            if (is_string($p->acta_inicio)) {
                $p->acta_inicio = json_decode($p->acta_inicio, true);
            }
            if (is_string($p->plan_trabajo)) {
                $p->plan_trabajo = json_decode($p->plan_trabajo, true);
            }

            return $p;
        });

        // Estadísticas generales para el panel
        $total = $pasantias->count();
        $finalizadas = $pasantias->where('estado', 'finalizada')->count();
        $en_curso = $pasantias->where('estado', 'en_curso')->count();
        $pendientes = $pasantias->where('estado', 'pendiente')->count();

        // Número total de bitácoras semanales pendientes por revisar para este tutor
        $bitacoras_pendientes = DB::table('pasantia_asistencias as a')
            ->join('pasantias as p', 'a.pasantia_id', '=', 'p.id')
            ->where('p.tutor_id', $tutor_id)
            ->where('a.estado', 'pendiente')
            ->count();

        return response()->json([
            'success' => true,
            'pasantias' => $pasantias,
            'stats' => [
                'total' => $total,
                'finalizadas' => $finalizadas,
                'en_curso' => $en_curso,
                'pendientes' => $pendientes,
                'bitacoras_pendientes' => $bitacoras_pendientes
            ]
        ]);
    }

    // GET /api/tutor/pasantias/{id}
    public function show(Request $request, $id)
    {
        $tutor_id = $this->getTutorId($request);

        $pasantia = DB::table('pasantias as p')
            ->leftJoin('users as e', 'p.estudiante_id', '=', 'e.id')
            ->leftJoin('users as t', 'p.tutor_id', '=', 't.id')
            ->where('p.id', $id)
            ->where('p.tutor_id', $tutor_id)
            ->select(
                'p.*',
                'e.name as estudiante_nombre',
                'e.email as estudiante_email',
                'e.codigo_estudiante',
                'e.documento as estudiante_documento',
                'e.ciclo',
                'e.firma as estudiante_firma',
                't.name as tutor_nombre',
                't.firma as tutor_firma'
            )
            ->first();

        if (!$pasantia) {
            return response()->json(['success' => false, 'message' => 'Pasantía no encontrada o no autorizada.'], 403);
        }

        // Decodificar JSONs
        if (is_string($pasantia->acta_inicio)) {
            $pasantia->acta_inicio = json_decode($pasantia->acta_inicio, true);
        }
        if (is_string($pasantia->plan_trabajo)) {
            $pasantia->plan_trabajo = json_decode($pasantia->plan_trabajo, true);
        }

        // Horas totales y semanales
        $asistencias = DB::table('pasantia_asistencias')
            ->where('pasantia_id', $id)
            ->orderBy('semana')
            ->get();

        $evaluaciones = DB::table('pasantia_evaluaciones')
            ->where('pasantia_id', $id)
            ->orderBy('corte')
            ->get();

        return response()->json([
            'success' => true,
            'pasantia' => $pasantia,
            'asistencias' => $asistencias,
            'evaluaciones' => $evaluaciones
        ]);
    }

    // POST /api/tutor/pasantias/subir-firma
    public function subirFirma(Request $request)
    {
        $tutor_id = $this->getTutorId($request);

        $request->validate([
            'firma' => 'required|image|max:5120',
        ]);

        $file = $request->file('firma');
        $extension = $file->getClientOriginalExtension();
        $nombre_archivo = "firma_tut_" . $tutor_id . "_" . time() . "." . $extension;

        $file->move(public_path('uploads/pasantias/firmas'), $nombre_archivo);

        DB::table('users')->where('id', $tutor_id)->update([
            'firma' => $nombre_archivo,
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Firma del tutor subida correctamente.',
            'firma' => $nombre_archivo
        ]);
    }

    // POST /api/tutor/pasantias/{id}/subir-firma-supervisor
    public function subirFirmaSupervisor(Request $request, $id)
    {
        $tutor_id = $this->getTutorId($request);

        $pasantia = DB::table('pasantias')->where('id', $id)->where('tutor_id', $tutor_id)->first();
        if (!$pasantia) {
            return response()->json(['success' => false, 'message' => 'No autorizado'], 403);
        }

        $request->validate([
            'firma' => 'required|image|max:5120',
        ]);

        $file = $request->file('firma');
        $extension = $file->getClientOriginalExtension();
        $nombre_archivo = "firma_sup_" . $id . "_" . time() . "." . $extension;

        $file->move(public_path('uploads/pasantias/firmas'), $nombre_archivo);

        DB::table('pasantias')->where('id', $id)->update([
            'firma_supervisor' => $nombre_archivo,
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Firma del supervisor de la empresa subida correctamente.',
            'firma_supervisor' => $nombre_archivo
        ]);
    }

    // POST /api/tutor/pasantias/asistencias/calificar
    public function calificarAsistencia(Request $request)
    {
        $tutor_id = $this->getTutorId($request);

        $request->validate([
            'asistencia_id'    => 'required|integer',
            'estado'           => 'required|string|in:aprobado,corregir',
            'comentario_tutor' => 'nullable|string'
        ]);

        // Verificar propiedad
        $asistencia = DB::table('pasantia_asistencias as a')
            ->join('pasantias as p', 'a.pasantia_id', '=', 'p.id')
            ->where('a.id', $request->asistencia_id)
            ->where('p.tutor_id', $tutor_id)
            ->select('a.*')
            ->first();

        if (!$asistencia) {
            return response()->json(['success' => false, 'message' => 'No autorizado'], 403);
        }

        DB::table('pasantia_asistencias')->where('id', $request->asistencia_id)->update([
            'estado' => $request->estado,
            'comentario_tutor' => $request->comentario_tutor,
            'updated_at' => now()
        ]);

        // Si el estado de la pasantía era 'pendiente', la cambiamos a 'en_curso' en la primera aprobación
        DB::table('pasantias')
            ->where('id', $asistencia->pasantia_id)
            ->where('estado', 'pendiente')
            ->update(['estado' => 'en_curso']);

        // Ejecutar verificación dual de finalización (Horas >= 384 y Nota Final >= 3.5)
        $this->verificarFinalizacionPasantia($asistencia->pasantia_id);

        return response()->json([
            'success' => true,
            'message' => 'Asistencia semanal calificada correctamente.'
        ]);
    }

    // POST /api/tutor/pasantias/evaluaciones/calificar
    public function calificarEvaluacion(Request $request)
    {
        $tutor_id = $this->getTutorId($request);

        $request->validate([
            'pasantia_id' => 'required|integer',
            'corte'       => 'required|integer|in:1,2',
            'comentarios' => 'nullable|string'
        ]);

        $pasantia = DB::table('pasantias')->where('id', $request->pasantia_id)->where('tutor_id', $tutor_id)->first();
        if (!$pasantia) {
            return response()->json(['success' => false, 'message' => 'No autorizado'], 403);
        }

        $corte = $request->corte;

        // Notas Actitudinales
        $act_1 = floatval($request->input('nota_act_1', 0));
        $act_2 = floatval($request->input('nota_act_2', 0));
        $act_3 = floatval($request->input('nota_act_3', 0));
        $act_4 = floatval($request->input('nota_act_4', 0));
        $act_5 = floatval($request->input('nota_act_5', 0));
        $act_6 = floatval($request->input('nota_act_6', 0));
        $act_7 = floatval($request->input('nota_act_7', 0));
        $act_8 = floatval($request->input('nota_act_8', 0));
        $act_9 = floatval($request->input('nota_act_9', 0));
        $prom_act = ($act_1 + $act_2 + $act_3 + $act_4 + $act_5 + $act_6 + $act_7 + $act_8 + $act_9) / 9;

        // Notas Procedimentales
        $proc_1 = floatval($request->input('nota_proc_1', 0));
        $proc_2 = floatval($request->input('nota_proc_2', 0));
        $proc_3 = floatval($request->input('nota_proc_3', 0));
        $proc_4 = floatval($request->input('nota_proc_4', 0));
        $proc_5 = floatval($request->input('nota_proc_5', 0));
        $proc_6 = floatval($request->input('nota_proc_6', 0));
        $proc_7 = floatval($request->input('nota_proc_7', 0));
        $proc_8 = floatval($request->input('nota_proc_8', 0));
        $proc_9 = floatval($request->input('nota_proc_9', 0));
        $prom_proc = ($proc_1 + $proc_2 + $proc_3 + $proc_4 + $proc_5 + $proc_6 + $proc_7 + $proc_8 + $proc_9) / 9;

        // Notas Cognitivas
        $cog_inf_1 = floatval($request->input('nota_cog_inf_1', 0));
        $cog_inf_2 = floatval($request->input('nota_cog_inf_2', 0));
        $cog_pro_1 = floatval($request->input('nota_cog_pro_1', 0));
        $cog_pro_2 = floatval($request->input('nota_cog_pro_2', 0));
        $cog_dom_1 = floatval($request->input('nota_cog_dom_1', 0));
        $cog_dom_2 = floatval($request->input('nota_cog_dom_2', 0));
        $prom_cog = ($cog_inf_1 + $cog_inf_2 + $cog_pro_1 + $cog_pro_2 + $cog_dom_1 + $cog_dom_2) / 6;

        // Ponderado
        // Actitudinal: 25%, Procedimental: 35%, Cognitivo: 40%
        $nota_corte = ($prom_act * 0.25) + ($prom_proc * 0.35) + ($prom_cog * 0.40);

        // Guardar/Actualizar
        $existe = DB::table('pasantia_evaluaciones')
            ->where('pasantia_id', $pasantia->id)
            ->where('corte', $corte)
            ->first();

        if ($existe) {
            return response()->json([
                'success' => false,
                'message' => 'Esta evaluación (Corte ' . $corte . ') ya ha sido calificada y guardada previamente. No se permite modificarla.'
            ], 400);
        }

        $data = [
            'pasantia_id'            => $pasantia->id,
            'corte'                  => $corte,
            'nota_act_1'             => $act_1,
            'nota_act_2'             => $act_2,
            'nota_act_3'             => $act_3,
            'nota_act_4'             => $act_4,
            'nota_act_5'             => $act_5,
            'nota_act_6'             => $act_6,
            'nota_act_7'             => $act_7,
            'nota_act_8'             => $act_8,
            'nota_act_9'             => $act_9,
            'promedio_actitudinal'   => round($prom_act, 2),
            'nota_proc_1'            => $proc_1,
            'nota_proc_2'            => $proc_2,
            'nota_proc_3'            => $proc_3,
            'nota_proc_4'            => $proc_4,
            'nota_proc_5'            => $proc_5,
            'nota_proc_6'            => $proc_6,
            'nota_proc_7'            => $proc_7,
            'nota_proc_8'            => $proc_8,
            'nota_proc_9'            => $proc_9,
            'promedio_procedimental' => round($prom_proc, 2),
            'nota_cog_inf_1'         => $cog_inf_1,
            'nota_cog_inf_2'         => $cog_inf_2,
            'nota_cog_pro_1'         => $cog_pro_1,
            'nota_cog_pro_2'         => $cog_pro_2,
            'nota_cog_dom_1'         => $cog_dom_1,
            'nota_cog_dom_2'         => $cog_dom_2,
            'promedio_cognitivo'     => round($prom_cog, 2),
            'nota_corte'             => round($nota_corte, 2),
            'comentarios'            => $request->comentarios,
            'updated_at'             => now()
        ];

        $data['created_at'] = now();
        DB::table('pasantia_evaluaciones')->insert($data);

        // Ejecutar verificación dual de finalización (Horas >= 384 y Nota Final >= 3.5)
        $this->verificarFinalizacionPasantia($pasantia->id);

        return response()->json([
            'success' => true,
            'message' => 'Evaluación del corte ' . ($corte === 1 ? '40%' : '60%') . ' registrada correctamente.'
        ]);
    }

    // POST /api/tutor/pasantias/{id}/guardar-acta
    public function guardarActa(Request $request, $id)
    {
        $tutor_id = $this->getTutorId($request);

        $pasantia = DB::table('pasantias')->where('id', $id)->where('tutor_id', $tutor_id)->first();
        if (!$pasantia) {
            return response()->json(['success' => false, 'message' => 'Pasantía no encontrada'], 404);
        }

        $acta_data = $request->input('acta_inicio');

        DB::table('pasantias')->where('id', $id)->update([
            'acta_inicio' => json_encode($acta_data),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Acta de inicio guardada correctamente por el tutor.'
        ]);
    }

    // GET /api/pasantias/{id}/pdf/acta
    public function generarActaHTML($id)
    {
        $p = DB::table('pasantias as p')
            ->leftJoin('users as e', 'p.estudiante_id', '=', 'e.id')
            ->leftJoin('users as t', 'p.tutor_id', '=', 't.id')
            ->where('p.id', $id)
            ->select(
                'p.*',
                'e.name as estudiante_nombre',
                'e.codigo_estudiante',
                'e.documento as estudiante_documento',
                'e.email as estudiante_email',
                'e.ciclo',
                'e.firma as estudiante_firma',
                't.name as tutor_nombre',
                't.email as tutor_email',
                't.telefono as tutor_telefono',
                't.firma as tutor_firma'
            )
            ->first();

        if (!$p) {
            return abort(404, 'Pasantía no encontrada.');
        }

        $acta = is_string($p->acta_inicio) ? json_decode($p->acta_inicio, true) : $p->acta_inicio;
        $acta = $acta ?: [];

        $asistentes = isset($acta['asistentes']) ? $acta['asistentes'] : '';
        $orden_dia = isset($acta['orden_dia']) ? $acta['orden_dia'] : [];
        $desarrollo = isset($acta['desarrollo']) ? $acta['desarrollo'] : [];

        $url_logofet = asset('IMG/logofet.png');

        return view('pdf_acta_inicio', compact('p', 'acta', 'asistentes', 'orden_dia', 'desarrollo', 'url_logofet'));
    }

    // GET /api/pasantias/{id}/pdf/plan
    public function generarPlanHTML($id)
    {
        $p = DB::table('pasantias as p')
            ->leftJoin('users as e', 'p.estudiante_id', '=', 'e.id')
            ->leftJoin('users as t', 'p.tutor_id', '=', 't.id')
            ->where('p.id', $id)
            ->select(
                'p.*',
                'e.name as estudiante_nombre',
                'e.codigo_estudiante',
                'e.documento as estudiante_documento',
                'e.email as estudiante_email',
                'e.ciclo',
                'e.firma as estudiante_firma',
                't.name as tutor_nombre',
                't.email as tutor_email',
                't.telefono as tutor_telefono',
                't.firma as tutor_firma'
            )
            ->first();

        if (!$p) {
            return abort(404, 'Pasantía no encontrada.');
        }

        $plan = is_string($p->plan_trabajo) ? json_decode($p->plan_trabajo, true) : $p->plan_trabajo;
        $plan = $plan ?: [];

        $actividades = isset($plan['actividades']) ? $plan['actividades'] : [];
        $responsables = isset($plan['responsables']) ? $plan['responsables'] : [];

        $url_logofet = asset('IMG/logofet.png');

        return view('pdf_plan_trabajo', compact('p', 'plan', 'actividades', 'responsables', 'url_logofet'));
    }

    // GET /api/pasantias/{id}/pdf/evaluacion/{corte}
    public function generarEvaluacionHTML($id, $corte)
    {
        $p = DB::table('pasantias as p')
            ->leftJoin('users as e', 'p.estudiante_id', '=', 'e.id')
            ->leftJoin('users as t', 'p.tutor_id', '=', 't.id')
            ->where('p.id', $id)
            ->select(
                'p.*',
                'e.name as estudiante_nombre',
                'e.codigo_estudiante',
                'e.documento as estudiante_documento',
                'e.email as estudiante_email',
                'e.ciclo',
                'e.firma as estudiante_firma',
                't.name as tutor_nombre',
                't.email as tutor_email',
                't.telefono as tutor_telefono',
                't.firma as tutor_firma'
            )
            ->first();

        if (!$p) {
            return abort(404, 'Pasantía no encontrada.');
        }

        $eval = DB::table('pasantia_evaluaciones')
            ->where('pasantia_id', $id)
            ->where('corte', $corte)
            ->first();

        if (!$eval) {
            return response('Esta evaluación aún no ha sido registrada por el tutor.', 404);
        }

        $url_logofet = asset('IMG/logofet.png');

        return view('pdf_evaluacion', compact('p', 'eval', 'corte', 'url_logofet'));
    }

    // GET /api/pasantias/{id}/excel/asistencia
    public function generarExcelAsistencia($id)
    {
        $p = DB::table('pasantias as p')
            ->leftJoin('users as e', 'p.estudiante_id', '=', 'e.id')
            ->leftJoin('users as t', 'p.tutor_id', '=', 't.id')
            ->where('p.id', $id)
            ->select(
                'p.*',
                'e.name as estudiante_nombre',
                'e.codigo_estudiante',
                'e.documento as estudiante_documento',
                't.name as tutor_nombre'
            )
            ->first();

        if (!$p) {
            return abort(404, 'Pasantía no encontrada.');
        }

        $asistencias = DB::table('pasantia_asistencias')
            ->where('pasantia_id', $id)
            ->orderBy('semana')
            ->get();

        $total_horas = $asistencias->where('estado', 'aprobado')->sum('horas');

        // Configurar cabeceras de Excel
        $filename = "Planilla_Asistencia_" . str_replace(' ', '_', $p->estudiante_nombre) . ".xls";
        header("Content-Type: application/vnd.ms-excel; charset=UTF-8");
        header("Content-Disposition: attachment; filename=\"$filename\"");
        header("Expires: 0");
        header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
        header("Pragma: public");

        // Retornar la tabla HTML estilizada para Excel
        return view('excel_asistencia', compact('p', 'asistencias', 'total_horas'));
    }

    /**
     * Verifica de forma dual si el estudiante cumple con los requisitos de horas y calificaciones para finalización de la pasantía.
     * Requisitos:
     * - Horas aprobadas >= 384
     * - Nota final >= 3.5 (calculada a partir del 40% del Corte 1 y el 60% del Corte 2)
     */
    private function verificarFinalizacionPasantia($pasantia_id)
    {
        $p = DB::table('pasantias')->where('id', $pasantia_id)->first();
        if (!$p) return;

        // Calcular total de horas aprobadas
        $horas_aprobadas = DB::table('pasantia_asistencias')
            ->where('pasantia_id', $pasantia_id)
            ->where('estado', 'aprobado')
            ->sum('horas') ?: 0;

        // Obtener las evaluaciones
        $evals = DB::table('pasantia_evaluaciones')
            ->where('pasantia_id', $pasantia_id)
            ->get();

        $c1 = $evals->firstWhere('corte', 1);
        $c2 = $evals->firstWhere('corte', 2);

        $nota_final = null;
        if ($c1 && $c2) {
            $nota_final = (floatval($c1->nota_corte) * 0.40) + (floatval($c2->nota_corte) * 0.60);
            $nota_final = round($nota_final, 2);
        }

        $updateData = [];
        if ($nota_final !== null) {
            $updateData['nota_final'] = $nota_final;
        }

        // Verificar condiciones duales
        if ($horas_aprobadas >= 384 && $nota_final !== null) {
            if ($nota_final >= 3.50) {
                $updateData['estado'] = 'finalizada';
            } else {
                $updateData['estado'] = 'rechazada'; // Reprobada
            }
        }

        if (!empty($updateData)) {
            $updateData['updated_at'] = now();
            DB::table('pasantias')->where('id', $pasantia_id)->update($updateData);
        }
    }
}
