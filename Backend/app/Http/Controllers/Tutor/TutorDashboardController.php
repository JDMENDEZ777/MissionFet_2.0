<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Pasantia;
use App\Models\Proyecto;

class TutorDashboardController extends Controller
{
    public function getStats(Request $request)
    {
        $tutor_id = $request->user()->id;

        // 1. Total de pasantías asignadas
        $total_pasantias = Pasantia::where('tutor_id', $tutor_id)->count();

        // 2. Total de proyectos asignados
        $total_proyectos = Proyecto::where('tutor_id', $tutor_id)->count();

        // 3. Pasantías con entregas pendientes de revisión
        $pasantias_pendientes = DB::table('entregas_pasantia')
            ->join('pasantias', 'entregas_pasantia.pasantia_id', '=', 'pasantias.id')
            ->where('pasantias.tutor_id', $tutor_id)
            ->where('entregas_pasantia.estado', 'pendiente')
            ->count();

        // 4. Proyectos con avances pendientes de revisión
        $proyectos_pendientes = DB::table('avances_proyecto')
            ->join('proyectos', 'avances_proyecto.proyecto_id', '=', 'proyectos.id')
            ->where('proyectos.tutor_id', $tutor_id)
            ->where('avances_proyecto.estado', 'pendiente')
            ->count();

        // 5. Mensajes no leídos (solo de chat de pasantías por ahora)
        $mensajes_pasantias = DB::table('mensajes_chat')
            ->join('pasantias', 'mensajes_chat.pasantia_id', '=', 'pasantias.id')
            ->where('pasantias.tutor_id', $tutor_id)
            ->where('mensajes_chat.receptor_id', $tutor_id)
            ->where('mensajes_chat.leido', false)
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_pasantias' => $total_pasantias,
                'total_proyectos' => $total_proyectos,
                'pasantias_pendientes' => $pasantias_pendientes,
                'proyectos_pendientes' => $proyectos_pendientes,
                'mensajes_pasantias' => $mensajes_pasantias,
                'notificaciones_pasantias' => $pasantias_pendientes + $mensajes_pasantias,
                'notificaciones_proyectos' => $proyectos_pendientes,
                'tiene_pasantias' => $total_pasantias > 0,
                'tiene_proyectos' => $total_proyectos > 0
            ]
        ]);
    }
}
