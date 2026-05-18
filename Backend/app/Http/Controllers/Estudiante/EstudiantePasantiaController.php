<?php

namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EstudiantePasantiaController extends Controller
{
    private function getEstudianteId(Request $request)
    {
        return $request->user()->id;
    }

    // GET /api/estudiante/pasantia
    public function index(Request $request)
    {
        $estudiante_id = $this->getEstudianteId($request);

        // Obtener pasantía activa del estudiante
        $pasantia = DB::table('pasantias as p')
            ->leftJoin('users as u', 'p.tutor_id', '=', 'u.id')
            ->leftJoin('users as e', 'p.estudiante_id', '=', 'e.id')
            ->where('p.estudiante_id', $estudiante_id)
            ->select(
                'p.*', 
                'u.name as tutor_nombre', 
                'u.email as tutor_email',
                'u.firma as tutor_firma',
                'e.name as estudiante_nombre',
                'e.codigo_estudiante',
                'e.email as estudiante_email',
                'e.documento as estudiante_documento',
                'e.ciclo',
                'e.firma as estudiante_firma'
            )
            ->first();

        if (!$pasantia) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes una pasantía asignada. Por favor, comunícate con administración.'
            ]);
        }

        // Decodificar JSONs para comodidad del frontend
        if (is_string($pasantia->acta_inicio)) {
            $pasantia->acta_inicio = json_decode($pasantia->acta_inicio, true);
        }
        if (is_string($pasantia->plan_trabajo)) {
            $pasantia->plan_trabajo = json_decode($pasantia->plan_trabajo, true);
        }

        // Obtener bitácora de asistencia
        $asistencias = DB::table('pasantia_asistencias')
            ->where('pasantia_id', $pasantia->id)
            ->orderBy('semana')
            ->get();

        // Obtener evaluaciones del corte (40% y 60%)
        $evaluaciones = DB::table('pasantia_evaluaciones')
            ->where('pasantia_id', $pasantia->id)
            ->orderBy('corte')
            ->get();

        return response()->json([
            'success' => true,
            'pasantia' => $pasantia,
            'asistencias' => $asistencias,
            'evaluaciones' => $evaluaciones
        ]);
    }

    // POST /api/estudiante/pasantia/subir-firma
    public function subirFirma(Request $request)
    {
        $estudiante_id = $this->getEstudianteId($request);

        $request->validate([
            'firma' => 'required|image|max:5120', // 5MB max
        ]);

        $file = $request->file('firma');
        $extension = $file->getClientOriginalExtension();
        $nombre_archivo = "firma_est_" . $estudiante_id . "_" . time() . "." . $extension;

        // Guardar en public/uploads/pasantias/firmas
        $file->move(public_path('uploads/pasantias/firmas'), $nombre_archivo);

        // Actualizar firma del usuario
        DB::table('users')->where('id', $estudiante_id)->update([
            'firma' => $nombre_archivo,
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Firma subida correctamente.',
            'firma' => $nombre_archivo
        ]);
    }

    // POST /api/estudiante/pasantia/guardar-acta
    public function guardarActa(Request $request)
    {
        $estudiante_id = $this->getEstudianteId($request);

        $pasantia = DB::table('pasantias')->where('estudiante_id', $estudiante_id)->first();
        if (!$pasantia) {
            return response()->json(['success' => false, 'message' => 'Pasantía no encontrada'], 404);
        }

        $acta_data = $request->input('acta_inicio');

        DB::table('pasantias')->where('id', $pasantia->id)->update([
            'acta_inicio' => json_encode($acta_data),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Acta de inicio guardada correctamente.'
        ]);
    }

    // POST /api/estudiante/pasantia/guardar-plan
    public function guardarPlan(Request $request)
    {
        $estudiante_id = $this->getEstudianteId($request);

        $pasantia = DB::table('pasantias')->where('estudiante_id', $estudiante_id)->first();
        if (!$pasantia) {
            return response()->json(['success' => false, 'message' => 'Pasantía no encontrada'], 404);
        }

        $plan_data = $request->input('plan_trabajo');

        DB::table('pasantias')->where('id', $pasantia->id)->update([
            'plan_trabajo' => json_encode($plan_data),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Plan de trabajo guardado correctamente.'
        ]);
    }

    // POST /api/estudiante/pasantia/asistencias
    public function subirAsistencia(Request $request)
    {
        $estudiante_id = $this->getEstudianteId($request);

        $pasantia = DB::table('pasantias')->where('estudiante_id', $estudiante_id)->first();
        if (!$pasantia) {
            return response()->json(['success' => false, 'message' => 'Pasantía no encontrada'], 404);
        }

        $request->validate([
            'semana'       => 'required|integer',
            'fecha_inicio' => 'required|date',
            'fecha_fin'    => 'required|date',
            'actividad'    => 'required|string',
            'horas'        => 'required|numeric|min:0.5',
            'evidencia'    => 'nullable|file|max:10240' // 10MB max (pdf, png, jpg, jpeg)
        ]);

        // Evitar semanas duplicadas para la misma pasantía
        $semana_existente = DB::table('pasantia_asistencias')
            ->where('pasantia_id', $pasantia->id)
            ->where('semana', $request->semana)
            ->first();

        if ($semana_existente) {
            return response()->json([
                'success' => false, 
                'message' => 'Ya has registrado un reporte para la semana ' . $request->semana
            ], 422);
        }

        $nombre_archivo = null;
        if ($request->hasFile('evidencia')) {
            $file = $request->file('evidencia');
            $extension = $file->getClientOriginalExtension();
            $nombre_archivo = "evidencia_sem_" . $request->semana . "_" . $pasantia->id . "_" . time() . "." . $extension;
            $file->move(public_path('uploads/pasantias/evidencias'), $nombre_archivo);
        }

        DB::table('pasantia_asistencias')->insert([
            'pasantia_id'    => $pasantia->id,
            'semana'         => $request->semana,
            'fecha_inicio'   => $request->fecha_inicio,
            'fecha_fin'      => $request->fecha_fin,
            'actividad'      => $request->actividad,
            'horas'          => $request->horas,
            'evidencia'      => $nombre_archivo,
            'estado'         => 'pendiente',
            'created_at'     => now(),
            'updated_at'     => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Reporte semanal de asistencia enviado correctamente.'
        ]);
    }

    // DELETE /api/estudiante/pasantia/asistencias/{id}
    public function eliminarAsistencia(Request $request, $id)
    {
        $estudiante_id = $this->getEstudianteId($request);

        $pasantia = DB::table('pasantias')->where('estudiante_id', $estudiante_id)->first();
        if (!$pasantia) {
            return response()->json(['success' => false, 'message' => 'Pasantía no encontrada'], 404);
        }

        $asistencia = DB::table('pasantia_asistencias')
            ->where('id', $id)
            ->where('pasantia_id', $pasantia->id)
            ->first();

        if (!$asistencia) {
            return response()->json(['success' => false, 'message' => 'Reporte no encontrado'], 404);
        }

        if ($asistencia->estado === 'aprobado') {
            return response()->json(['success' => false, 'message' => 'No puedes eliminar un reporte semanal que ya ha sido aprobado.'], 422);
        }

        // Borrar evidencia si existe
        if ($asistencia->evidencia) {
            $path = public_path('uploads/pasantias/evidencias/' . $asistencia->evidencia);
            if (file_exists($path)) {
                unlink($path);
            }
        }

        DB::table('pasantia_asistencias')->where('id', $id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Reporte semanal eliminado correctamente.'
        ]);
    }
}
