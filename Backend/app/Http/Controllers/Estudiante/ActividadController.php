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
    public function store(Request $request, $seminario_id, $act_id)
    {
        $estudiante_id = Auth::id();

        // Verificar que la actividad pertenece al seminario
        $actividad = Actividad::where('id', $act_id)
            ->where('seminario_id', $seminario_id)
            ->firstOrFail();

        // Verificar que no haya entregado ya esta actividad
        $entregaExistente = EntregaActividad::where('actividad_id', $act_id)
            ->where('estudiante_id', $estudiante_id)
            ->first();

        if ($entregaExistente) {
            return response()->json(['message' => 'Ya entregaste esta actividad anteriormente.'], 409);
        }

        // Verificar fecha límite
        if (!$actividad->permitir_entregas_tarde && now()->toDateString() > $actividad->fecha_limite->toDateString()) {
            return response()->json(['message' => 'La fecha límite de entrega ya pasó.'], 403);
        }

        $request->validate([
            'comentario' => 'nullable',
        ]);

        // Si el tamaño del body supera post_max_size, PHP vacía $_POST y $_FILES
        $contentLength = (int) $request->server('CONTENT_LENGTH');
        if ($contentLength > 0 && empty($request->all())) {
            return response()->json([
                'message' => 'El archivo que intentas subir es demasiado pesado y supera el límite de tu servidor. Intenta con un archivo más pequeño.'
            ], 422);
        }

        // Validación manual de archivos para evitar fallos 422 de Laravel por formato de FormData o upload_max_filesize
        if ($request->hasFile('archivos')) {
            $files = $request->file('archivos');
            if (!is_array($files)) $files = [$files];
            foreach ($files as $file) {
                if (!$file->isValid()) {
                    return response()->json([
                        'message' => 'Uno de los archivos superó el límite de peso permitido por el servidor (php.ini) o está corrupto.'
                    ], 422);
                }
            }
        }

        // Crear el registro de la entrega
        $entrega = EntregaActividad::create([
            'actividad_id'  => $act_id,
            'estudiante_id' => $estudiante_id,
            'comentario'    => $request->comentario,
            'estado'        => 'pendiente',
        ]);

        // Guardar archivos adjuntos
        if ($request->hasFile('archivos')) {
            $files = $request->file('archivos');
            if (!is_array($files)) $files = [$files];

            foreach ($files as $archivo) {
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

        return response()->json([
            'message' => '¡Actividad entregada exitosamente!',
            'data' => $entrega->load('archivos')
        ], 201);
    }
}
