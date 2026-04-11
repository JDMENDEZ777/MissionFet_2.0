<?php

namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use App\Models\Actividad;
use App\Models\EntregaActividad;
use App\Models\ArchivoEntrega;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

/**
 * Controlador de Actividades para el rol Estudiante.
 * Permite ver las actividades del seminario en el que está inscrito
 * y entregar sus tareas con archivos adjuntos.
 */
class ActividadController extends Controller
{
    /**
     * Lista las actividades del seminario con el estado de entrega del estudiante.
     * Filtra por tipo: pendientes, entregadas, calificadas, todas.
     */
    public function index(Request $request, $seminario_id)
    {
        $estudiante_id = Auth::id();
        $filtro        = $request->query('filtro', 'pendientes');

        // Obtener todas las actividades del seminario con la entrega del estudiante si existe
        $actividades = Actividad::with(['archivos', 'entregas' => function ($query) use ($estudiante_id) {
                $query->where('estudiante_id', $estudiante_id)->with('archivos');
            }])
            ->where('seminario_id', $seminario_id)
            ->latest('fecha_limite')
            ->get();

        // Aplicar filtros según el estado de la entrega del estudiante
        $actividades = $actividades->filter(function ($actividad) use ($filtro) {
            $entrega = $actividad->entregas->first();

            return match ($filtro) {
                'pendientes'  => is_null($entrega),
                'entregadas'  => !is_null($entrega) && $entrega->estado !== 'calificado',
                'calificadas' => !is_null($entrega) && $entrega->estado === 'calificado',
                default       => true, // 'todas'
            };
        })->values();

        // Añadir la entrega del estudiante como propiedad plana para facilitar el frontend
        $actividades = $actividades->map(function ($actividad) {
            $actividad->mi_entrega = $actividad->entregas->first();
            unset($actividad->entregas);
            return $actividad;
        });

        return response()->json(['data' => $actividades]);
    }

    /**
     * El estudiante entrega una actividad con un comentario y archivos adjuntos.
     * Solo se permite una entrega por actividad (a menos que ya esté calificada).
     */
    public function store(Request $request, $seminario_id, $actividad_id)
    {
        $estudiante_id = Auth::id();

        // Verificar que la actividad pertenece al seminario
        $actividad = Actividad::where('id', $actividad_id)
            ->where('seminario_id', $seminario_id)
            ->firstOrFail();

        // Verificar que no haya entregado ya esta actividad
        $entregaExistente = EntregaActividad::where('actividad_id', $actividad_id)
            ->where('estudiante_id', $estudiante_id)
            ->first();

        if ($entregaExistente) {
            return response()->json(['message' => 'Ya entregaste esta actividad anteriormente.'], 409);
        }

        // Verificar fecha límite (solo si no se permiten entregas tardías)
        if (!$actividad->permitir_entregas_tarde && now()->toDateString() > $actividad->fecha_limite->toDateString()) {
            return response()->json(['message' => 'La fecha límite de entrega ya pasó.'], 403);
        }

        $request->validate([
            'comentario' => 'nullable|string|max:2000',
            'archivos.*' => 'nullable|file|max:10240',
        ]);

        // Crear el registro de la entrega
        $entrega = EntregaActividad::create([
            'actividad_id'  => $actividad_id,
            'estudiante_id' => $estudiante_id,
            'comentario'    => $request->comentario,
            'estado'        => 'pendiente',
        ]);

        // Guardar archivos adjuntos de la entrega
        if ($request->hasFile('archivos')) {
            foreach ($request->file('archivos') as $archivo) {
                $ruta = $archivo->store("entregas/{$entrega->id}", 'public');
                ArchivoEntrega::create([
                    'entrega_id'     => $entrega->id,
                    'nombre_archivo' => $archivo->getClientOriginalName(),
                    'ruta_archivo'   => $ruta,
                    'tipo_archivo'   => $archivo->getMimeType(),
                    'tamano_archivo' => $archivo->getSize(),
                ]);
            }
        }

        return response()->json(['message' => '¡Actividad entregada exitosamente!', 'data' => $entrega->load('archivos')], 201);
    }
}
