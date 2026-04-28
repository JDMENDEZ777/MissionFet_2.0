<?php

namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use App\Models\ClaseVirtual;
use App\Models\MaterialApoyo;
use App\Models\InscripcionSeminario;
use App\Models\Seminario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Controlador del Dashboard del Estudiante en el módulo Seminario.
 * Gestiona la información del seminario al que está inscrito:
 * - Datos del seminario y su inscripción
 * - Clases virtuales próximas
 * - Materiales de apoyo
 */
class SeminarioDashboardController extends Controller
{
    /**
     * Retorna la información general del seminario en el que el estudiante está inscrito,
     * junto con sus estadísticas: actividades pendientes, nota actual, etc.
     */
    public function mySeminario($seminario_id)
    {
        $estudiante_id = Auth::id();

        // Verificar que el estudiante está inscrito en este seminario
        $inscripcion = InscripcionSeminario::where('seminario_id', $seminario_id)
            ->where('estudiante_id', $estudiante_id)
            ->firstOrFail();

        $seminario = Seminario::with('tutor')->find($seminario_id);

        return response()->json([
            'seminario'   => $seminario,
            'inscripcion' => $inscripcion,
        ]);
    }

    /**
     * Lista las clases virtuales del seminario ordenadas por fecha.
     * Las próximas aparecen primero.
     */
    public function clases($seminario_id)
    {
        // Verificar inscripción del estudiante
        InscripcionSeminario::where('seminario_id', $seminario_id)
            ->where('estudiante_id', Auth::id())
            ->firstOrFail();

        $clases = ClaseVirtual::where('seminario_id', $seminario_id)
            ->orderBy('fecha')
            ->orderBy('hora')
            ->get();

        return response()->json(['data' => $clases]);
    }

    /**
     * Lista los materiales de apoyo del seminario con sus archivos descargables.
     */
    public function materiales($seminario_id)
    {
        // Verificar inscripción del estudiante
        InscripcionSeminario::where('seminario_id', $seminario_id)
            ->where('estudiante_id', Auth::id())
            ->firstOrFail();

        $materiales = MaterialApoyo::with('archivos')
            ->where('seminario_id', $seminario_id)
            ->latest()
            ->get();

        return response()->json(['data' => $materiales]);
    }

    /**
     * Retorna el dashboard inicial del estudiante: estadísticas rápidas.
     * - Actividades pendientes / entregadas / calificadas
     * - Próxima clase
     */
    public function dashboard($seminario_id)
    {
        $estudiante_id = Auth::id();

        InscripcionSeminario::where('seminario_id', $seminario_id)
            ->where('estudiante_id', $estudiante_id)
            ->firstOrFail();

        // Contar actividades del seminario y el estado de las entregas del estudiante
        $actividades = \App\Models\Actividad::where('seminario_id', $seminario_id)->get();

        $ids_actividades = $actividades->pluck('id');

        $entregas = \App\Models\EntregaActividad::where('estudiante_id', $estudiante_id)
            ->whereIn('actividad_id', $ids_actividades)
            ->get();

        $pendientes  = $actividades->count() - $entregas->count();
        $entregadas  = $entregas->where('estado', '!=', 'calificado')->count();
        $calificadas = $entregas->where('estado', 'calificado')->count();

        // Promedio de notas obtenidas hasta el momento
        $promedio = $entregas->where('estado', 'calificado')->avg('calificacion');

        // Próxima clase virtual
        $proxima_clase = ClaseVirtual::where('seminario_id', $seminario_id)
            ->where('fecha', '>=', now()->toDateString())
            ->orderBy('fecha')
            ->orderBy('hora')
            ->first();

        return response()->json([
            'stats' => [
                'pendientes'  => max(0, $pendientes),
                'entregadas'  => $entregadas,
                'calificadas' => $calificadas,
                'promedio'    => $promedio ? round($promedio, 2) : null,
            ],
            'proxima_clase' => $proxima_clase,
        ]);
    }
    /**
     * Retorna la lista de seminarios en los que el estudiante está inscrito.
     */
    public function misSeminarios()
    {
        $inscripciones = InscripcionSeminario::with('seminario.tutor')
            ->where('estudiante_id', Auth::id())
            ->get();

        return response()->json([
            'data' => $inscripciones
        ]);
    }
}
