<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use App\Models\Actividad;
use App\Models\ArchivoActividad;
use App\Models\InscripcionSeminario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

/**
 * Controlador de Actividades para el rol Tutor.
 * Permite crear, listar, editar y eliminar actividades
 * dentro de los seminarios que el tutor tiene asignados.
 */
class ActividadController extends Controller
{
    /**
     * Lista todas las actividades de un seminario específico.
     * Solo el tutor asignado a ese seminario puede verlas.
     */
    public function index(Request $request, $seminario_id)
    {
        $tutor_id = Auth::id();
        $filtro   = $request->query('filtro', 'todas');

        // Consulta base: actividades de este seminario creadas por este tutor
        // Eager load de archivos y entregas para evitar N+1
        $query = Actividad::with(['archivos', 'entregas'])
            ->where('seminario_id', $seminario_id)
            ->where('tutor_id', $tutor_id);

        // Aplicar filtro según pestaña seleccionada
        if ($filtro === 'pendientes') {
            // Aún dentro del plazo
            $query->where('fecha_limite', '>=', now()->toDateString());
        } elseif ($filtro === 'vencidas') {
            // Fuera del plazo
            $query->where('fecha_limite', '<', now()->toDateString());
        } elseif ($filtro === 'calificadas') {
            // Actividades que tienen al menos una entrega calificada
            $query->whereHas('entregas', fn($q) => $q->where('estado', 'calificado'));
        }

        $actividades = $query->latest()->get();

        // Enriquecer cada actividad con sus estadísticas de entrega (usando la colección ya cargada)
        $actividades = $actividades->map(function ($actividad) {
            $actividad->total_entregas       = $actividad->entregas->count();
            $actividad->entregas_pendientes  = $actividad->entregas->where('estado', 'pendiente')->count();
            $actividad->entregas_calificadas = $actividad->entregas->where('estado', 'calificado')->count();
            $actividad->calificacion_promedio = $actividad->entregas
                ->where('estado', 'calificado')
                ->avg('calificacion');
            
            // Ocultar entregas completas para no inflar la respuesta JSON
            unset($actividad->entregas);
            
            return $actividad;
        });

        return response()->json(['data' => $actividades]);
    }

    /**
     * Crea una nueva actividad para el seminario dado.
     * Permite adjuntar archivos de enunciado (PDF, Word, etc.).
     */
    public function store(Request $request, $seminario_id)
    {
        \Illuminate\Support\Facades\Log::info('POST a store Actividad', $request->all());
        
        // Si el tamaño del body supera post_max_size, PHP vacía $_POST y $_FILES
        $contentLength = (int) $request->server('CONTENT_LENGTH');
        if ($contentLength > 0 && empty($request->all())) {
            \Illuminate\Support\Facades\Log::warning('Payload vacío por post_max_size', ['content_length' => $contentLength]);
            return response()->json([
                'message' => 'El archivo que intentas subir es demasiado pesado y supera el límite de tu servidor. Intenta con un archivo más pequeño.'
            ], 422);
        }

        // Validación manual para ver si algún archivo superó el upload_max_filesize (por defecto 2MB)
        if ($request->hasFile('archivos')) {
            $archivos = $request->file('archivos');
            if (!is_array($archivos)) $archivos = [$archivos];
            foreach ($archivos as $archivo) {
                if (!$archivo->isValid()) {
                    return response()->json([
                        'message' => 'Uno de los archivos que intentas subir es más pesado que el límite de 2MB configurado en tu servidor (upload_max_filesize). Debes editar tu php.ini o subir un archivo más pequeño.'
                    ], 422);
                }
            }
        }

        $request->validate([
            'titulo'                  => 'required|string|max:255',
            'descripcion'             => 'nullable|string',
            'fecha_limite'            => 'required|date|after_or_equal:today',
            'hora_limite'             => 'required',
            'tipo'                    => 'required|in:tarea,proyecto,examen,cuestionario,investigacion',
            'puntaje'                 => 'required|numeric|min:0|max:5',
            'permitir_entregas_tarde' => 'boolean',
            'archivos.*'              => 'nullable|file|max:10240', // Máx 10MB por archivo
        ]);

        $actividad = Actividad::create([
            'seminario_id'            => $seminario_id,
            'tutor_id'                => Auth::id(),
            'titulo'                  => $request->titulo,
            'descripcion'             => $request->descripcion,
            'fecha_limite'            => $request->fecha_limite,
            'hora_limite'             => $request->hora_limite,
            'tipo'                    => $request->tipo,
            'puntaje'                 => $request->puntaje,
            'permitir_entregas_tarde' => $request->boolean('permitir_entregas_tarde'),
        ]);

        // Procesar archivos adjuntos del enunciado
        if ($request->hasFile('archivos')) {
            foreach ($request->file('archivos') as $archivo) {
                $ruta = $archivo->store("actividades/{$actividad->id}", 'public');
                ArchivoActividad::create([
                    'actividad_id'   => $actividad->id,
                    'nombre_archivo' => $archivo->getClientOriginalName(),
                    'ruta_archivo'   => $ruta,
                    'tipo_archivo'   => $archivo->getMimeType(),
                    'tamano_archivo' => $archivo->getSize(),
                ]);
            }
        }

        return response()->json(['message' => 'Actividad creada exitosamente.', 'data' => $actividad->load('archivos')], 201);
    }

    /**
     * Retorna el detalle de una actividad con todas sus entregas de estudiantes.
     */
    public function show($seminario_id, $actividad_id)
    {
        $actividad = Actividad::with(['archivos', 'entregas.estudiante', 'entregas.archivos'])
            ->where('id', $actividad_id)
            ->where('seminario_id', $seminario_id)
            ->where('tutor_id', Auth::id())
            ->firstOrFail();

        return response()->json(['data' => $actividad]);
    }

    /**
     * Actualiza una actividad existente.
     */
    public function update(Request $request, $seminario_id, $actividad_id)
    {
        $actividad = Actividad::where('id', $actividad_id)
            ->where('seminario_id', $seminario_id)
            ->where('tutor_id', Auth::id())
            ->firstOrFail();

        $request->validate([
            'titulo'                  => 'sometimes|string|max:255',
            'descripcion'             => 'nullable|string',
            'fecha_limite'            => 'sometimes|date',
            'hora_limite'             => 'sometimes',
            'tipo'                    => 'sometimes|in:tarea,proyecto,examen,cuestionario,investigacion',
            'puntaje'                 => 'sometimes|numeric|min:0|max:5',
            'permitir_entregas_tarde' => 'boolean',
        ]);

        $data = $request->only([
            'titulo', 'descripcion', 'fecha_limite', 'hora_limite',
            'tipo', 'puntaje'
        ]);

        if ($request->has('permitir_entregas_tarde')) {
            $data['permitir_entregas_tarde'] = $request->boolean('permitir_entregas_tarde');
        }

        $actividad->update($data);

        return response()->json(['message' => 'Actividad actualizada.', 'data' => $actividad]);
    }

    /**
     * Elimina una actividad (en cascada elimina archivos y entregas).
     */
    public function destroy($seminario_id, $actividad_id)
    {
        $actividad = Actividad::where('id', $actividad_id)
            ->where('seminario_id', $seminario_id)
            ->where('tutor_id', Auth::id())
            ->firstOrFail();

        // Eliminar archivos físicos del storage
        foreach ($actividad->archivos as $archivo) {
            Storage::disk('public')->delete($archivo->ruta_archivo);
        }

        $actividad->delete();

        return response()->json(['message' => 'Actividad eliminada exitosamente.']);
    }
}
