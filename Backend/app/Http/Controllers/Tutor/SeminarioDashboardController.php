<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use App\Models\Actividad;
use App\Models\ClaseVirtual;
use App\Models\EntregaActividad;
use App\Models\InscripcionSeminario;
use Illuminate\Support\Facades\Auth;

/**
 * Controlador del Dashboard del Tutor en el módulo Seminario.
 * Retorna las estadísticas principales para la pantalla de inicio del tutor.
 */
class SeminarioDashboardController extends Controller
{
    /**
     * Retorna estadísticas del seminario para el tutor:
     * - Total de estudiantes inscritos
     * - Total de actividades creadas
     * - Entregas pendientes de calificar
     * - Próxima clase virtual
     * - Últimas 5 entregas recibidas
     */
    public function dashboard($seminario_id)
    {
        $tutor_id = Auth::id();

        // Total de estudiantes inscritos en el seminario
        $total_estudiantes = InscripcionSeminario::where('seminario_id', $seminario_id)->count();

        // Actividades del tutor en este seminario
        $ids_actividades = Actividad::where('seminario_id', $seminario_id)
            ->where('tutor_id', $tutor_id)
            ->pluck('id');

        $total_actividades = $ids_actividades->count();

        // Total de entregas pendientes de calificar
        $entregas_pendientes = EntregaActividad::whereIn('actividad_id', $ids_actividades)
            ->where('estado', 'pendiente')
            ->count();

        // Próxima clase virtual del tutor en este seminario
        $proxima_clase = ClaseVirtual::where('seminario_id', $seminario_id)
            ->where('tutor_id', $tutor_id)
            ->where('fecha', '>=', now()->toDateString())
            ->orderBy('fecha')
            ->orderBy('hora')
            ->first();

        // Últimas 5 entregas recibidas (para mostrar en el panel de inicio)
        $ultimas_entregas = EntregaActividad::with(['estudiante', 'actividad'])
            ->whereIn('actividad_id', $ids_actividades)
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'stats' => [
                'total_estudiantes'  => $total_estudiantes,
                'total_actividades'  => $total_actividades,
                'entregas_pendientes' => $entregas_pendientes,
            ],
            'proxima_clase'   => $proxima_clase,
            'ultimas_entregas' => $ultimas_entregas,
        ]);
    }

    /**
     * Retorna la lista de estudiantes inscritos en el seminario.
     * Útil para asignar materiales de apoyo a estudiantes específicos.
     */
    public function estudiantes($seminario_id)
    {
        $estudiantes = InscripcionSeminario::with('estudiante:id,name,email,avatar')
            ->where('seminario_id', $seminario_id)
            ->where('estado', 'aprobado')
            ->get()
            ->pluck('estudiante');

        return response()->json(['data' => $estudiantes]);
    }
}
