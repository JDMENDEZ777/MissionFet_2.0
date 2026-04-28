<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use App\Models\EntregaActividad;
use App\Models\Actividad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Controlador de Calificaciones para el rol Tutor.
 * Permite al tutor revisar y calificar las entregas
 * de los estudiantes para sus actividades.
 */
class EntregaController extends Controller
{
    /**
     * Muestra todas las entregas de una actividad específica.
     * Incluye información del estudiante y sus archivos adjuntos.
     */
    public function index($seminario_id, $actividad_id)
    {
        // Verificar que la actividad pertenece al tutor logueado
        $actividad = Actividad::where('id', $actividad_id)
            ->where('seminario_id', $seminario_id)
            ->where('tutor_id', Auth::id())
            ->firstOrFail();

        $entregas = EntregaActividad::with(['estudiante', 'archivos'])
            ->where('actividad_id', $actividad_id)
            ->latest()
            ->get();

        return response()->json([
            'actividad' => $actividad->load('archivos'),
            'entregas'  => $entregas,
        ]);
    }

    /**
     * Califica una entrega específica de un estudiante.
     * Una vez calificada, el estado cambia a 'calificado' y no puede ser modificada.
     */
    public function calificar(Request $request, $seminario_id, $actividad_id, $entrega_id)
    {
        // Verificar que la actividad pertenece al tutor logueado
        Actividad::where('id', $actividad_id)
            ->where('seminario_id', $seminario_id)
            ->where('tutor_id', Auth::id())
            ->firstOrFail();

        $entrega = EntregaActividad::where('id', $entrega_id)
            ->where('actividad_id', $actividad_id)
            ->firstOrFail();

        // Regla de negocio: no se puede re-calificar una entrega ya calificada
        if ($entrega->estado === 'calificado') {
            return response()->json(['message' => 'Esta entrega ya fue calificada y no puede modificarse.'], 403);
        }

        $request->validate([
            'calificacion'     => 'required|numeric|min:0|max:5',
            'comentario_tutor' => 'nullable|string|max:2000',
        ]);

        $calificacion = floatval($request->calificacion);

        $entrega->update([
            'calificacion'      => $calificacion,
            'comentario_tutor'  => $request->comentario_tutor,
            'estado'            => 'calificado',
            'fecha_calificacion' => now(),
        ]);

        return response()->json(['message' => 'Entrega calificada exitosamente.', 'data' => $entrega]);
    }
}
