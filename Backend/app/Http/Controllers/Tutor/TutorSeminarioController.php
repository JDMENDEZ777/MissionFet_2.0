<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\Seminario;
use App\Models\SeminarioActividad;
use App\Models\SeminarioEntrega;
use App\Models\SeminarioRecurso;

class TutorSeminarioController extends Controller
{
    private function getTutorId(Request $request)
    {
        return $request->user()->id;
    }

    // 1. OBTENER SEMINARIO ASIGNADO Y ESTUDIANTES MATRICULADOS
    public function index(Request $request)
    {
        $tutor_id = $this->getTutorId($request);

        // Buscamos el seminario asignado al tutor (se prefiere el activo)
        $seminario = Seminario::where('tutor_id', $tutor_id)
            ->orderByRaw("CASE WHEN estado = 'activo' THEN 1 ELSE 2 END")
            ->first();

        if (!$seminario) {
            return response()->json([
                'success' => true,
                'seminario' => null,
                'estudiantes' => [],
                'stats' => [
                    'total_estudiantes' => 0,
                    'total_actividades' => 0,
                    'total_recursos' => 0,
                ]
            ]);
        }

        // Obtener estudiantes inscritos
        $estudiantes = DB::table('inscripciones_seminario as i')
            ->join('users as u', 'i.estudiante_id', '=', 'u.id')
            ->where('i.seminario_id', $seminario->id)
            ->select(
                'u.id',
                'u.name as nombre',
                'u.email',
                'u.codigo_estudiante as codigo',
                'u.documento',
                'i.estado',
                'i.nota as nota_final'
            )
            ->orderBy('u.name', 'asc')
            ->get();

        // Calcular nota promedio actual de cada estudiante en base a sus entregas
        foreach ($estudiantes as $estudiante) {
            $promedio = DB::table('seminario_entregas as e')
                ->join('seminario_actividades as a', 'e.actividad_id', '=', 'a.id')
                ->where('a.seminario_id', $seminario->id)
                ->where('e.estudiante_id', $estudiante->id)
                ->where('e.estado', 'calificado')
                ->avg('e.nota');

            $estudiante->nota_promedio = $promedio !== null ? round($promedio, 1) : null;
        }

        // Contar actividades y recursos
        $total_actividades = SeminarioActividad::where('seminario_id', $seminario->id)->count();
        $total_recursos = SeminarioRecurso::where('seminario_id', $seminario->id)->count();

        return response()->json([
            'success' => true,
            'seminario' => $seminario,
            'estudiantes' => $estudiantes,
            'stats' => [
                'total_estudiantes' => count($estudiantes),
                'total_actividades' => $total_actividades,
                'total_recursos' => $total_recursos,
            ]
        ]);
    }

    // 2. ACTUALIZAR ENLACE ÚNICO DE CLASE VIRTUAL
    public function updateEnlace(Request $request)
    {
        $request->validate([
            'enlace' => 'required|string|url|max:2000'
        ], [
            'enlace.required' => 'El enlace es obligatorio.',
            'enlace.url' => 'Debe ingresar una URL válida (ej: https://meet.google.com/...)',
        ]);

        $tutor_id = $this->getTutorId($request);
        $seminario = Seminario::where('tutor_id', $tutor_id)->first();

        if (!$seminario) {
            return response()->json(['success' => false, 'message' => 'No tiene seminarios asignados.'], 404);
        }

        // Reutilizamos el campo 'lugar'
        $seminario->update(['lugar' => $request->enlace]);

        return response()->json([
            'success' => true,
            'message' => 'Enlace de la clase virtual actualizado exitosamente.',
            'lugar' => $seminario->lugar
        ]);
    }

    // 3. LISTAR ACTIVIDADES
    public function getActividades(Request $request)
    {
        $tutor_id = $this->getTutorId($request);
        $seminario = Seminario::where('tutor_id', $tutor_id)->first();

        if (!$seminario) {
            return response()->json(['success' => false, 'message' => 'Seminario no encontrado.'], 404);
        }

        $actividades = SeminarioActividad::where('seminario_id', $seminario->id)
            ->orderBy('fecha_limite', 'asc')
            ->orderBy('hora_limite', 'asc')
            ->get();

        // Enriquecer cada actividad con cantidad de entregas totales y por calificar
        foreach ($actividades as $actividad) {
            $actividad->total_entregas = SeminarioEntrega::where('actividad_id', $actividad->id)->count();
            $actividad->entregas_calificadas = SeminarioEntrega::where('actividad_id', $actividad->id)
                ->where('estado', 'calificado')
                ->count();
            $actividad->entregas_pendientes = $actividad->total_entregas - $actividad->entregas_calificadas;
        }

        return response()->json([
            'success' => true,
            'actividades' => $actividades
        ]);
    }

    // 4. CREAR ACTIVIDAD
    public function storeActividad(Request $request)
    {
        $request->validate([
            'titulo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'puntaje' => 'required|numeric|min:0|max:5',
            'fecha_limite' => 'required|date',
            'hora_limite' => 'required',
            'permite_entregas_tardias' => 'required|boolean'
        ]);

        $tutor_id = $this->getTutorId($request);
        $seminario = Seminario::where('tutor_id', $tutor_id)->first();

        if (!$seminario) {
            return response()->json(['success' => false, 'message' => 'Seminario no encontrado.'], 404);
        }

        $actividad = SeminarioActividad::create([
            'seminario_id' => $seminario->id,
            'titulo' => $request->titulo,
            'descripcion' => $request->descripcion,
            'puntaje' => $request->puntaje,
            'fecha_limite' => $request->fecha_limite,
            'hora_limite' => $request->hora_limite,
            'permite_entregas_tardias' => $request->permite_entregas_tardias,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Actividad creada con éxito.',
            'actividad' => $actividad
        ], 201);
    }

    // 5. EDITAR ACTIVIDAD
    public function updateActividad(Request $request, $id)
    {
        $request->validate([
            'titulo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'puntaje' => 'required|numeric|min:0|max:5',
            'fecha_limite' => 'required|date',
            'hora_limite' => 'required',
            'permite_entregas_tardias' => 'required|boolean'
        ]);

        $tutor_id = $this->getTutorId($request);
        $seminario = Seminario::where('tutor_id', $tutor_id)->first();

        if (!$seminario) {
            return response()->json(['success' => false, 'message' => 'Seminario no encontrado.'], 404);
        }

        $actividad = SeminarioActividad::where('id', $id)
            ->where('seminario_id', $seminario->id)
            ->first();

        if (!$actividad) {
            return response()->json(['success' => false, 'message' => 'Actividad no encontrada.'], 404);
        }

        $actividad->update([
            'titulo' => $request->titulo,
            'descripcion' => $request->descripcion,
            'puntaje' => $request->puntaje,
            'fecha_limite' => $request->fecha_limite,
            'hora_limite' => $request->hora_limite,
            'permite_entregas_tardias' => $request->permite_entregas_tardias,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Actividad actualizada con éxito.',
            'actividad' => $actividad
        ]);
    }

    // 6. ELIMINAR ACTIVIDAD
    public function destroyActividad(Request $request, $id)
    {
        $tutor_id = $this->getTutorId($request);
        $seminario = Seminario::where('tutor_id', $tutor_id)->first();

        if (!$seminario) {
            return response()->json(['success' => false, 'message' => 'Seminario no encontrado.'], 404);
        }

        $actividad = SeminarioActividad::where('id', $id)
            ->where('seminario_id', $seminario->id)
            ->first();

        if (!$actividad) {
            return response()->json(['success' => false, 'message' => 'Actividad no encontrada.'], 404);
        }

        $actividad->delete();

        return response()->json([
            'success' => true,
            'message' => 'Actividad eliminada con éxito.'
        ]);
    }

    // 7. OBTENER ENTREGAS DE UNA ACTIVIDAD
    public function getEntregas(Request $request, $id)
    {
        $tutor_id = $this->getTutorId($request);
        $seminario = Seminario::where('tutor_id', $tutor_id)->first();

        if (!$seminario) {
            return response()->json(['success' => false, 'message' => 'Seminario no encontrado.'], 404);
        }

        $actividad = SeminarioActividad::where('id', $id)
            ->where('seminario_id', $seminario->id)
            ->first();

        if (!$actividad) {
            return response()->json(['success' => false, 'message' => 'Actividad no encontrada.'], 404);
        }

        // Listar estudiantes inscritos con su respectiva entrega (si la tienen)
        $estudiantes = DB::table('inscripciones_seminario as i')
            ->join('users as u', 'i.estudiante_id', '=', 'u.id')
            ->leftJoin('seminario_entregas as e', function ($join) use ($id) {
                $join->on('e.estudiante_id', '=', 'u.id')
                     ->where('e.actividad_id', '=', $id);
            })
            ->where('i.seminario_id', $seminario->id)
            ->select(
                'u.id as estudiante_id',
                'u.name as estudiante_nombre',
                'u.codigo_estudiante',
                'u.email',
                'e.id as entrega_id',
                'e.archivo',
                'e.comentario_estudiante',
                'e.nota',
                'e.comentario_tutor',
                'e.fecha_entrega',
                'e.estado'
            )
            ->orderBy('u.name', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'actividad' => $actividad,
            'entregas' => $estudiantes
        ]);
    }

    // 8. CALIFICAR UNA ENTREGA
    public function calificarEntrega(Request $request, $id)
    {
        $request->validate([
            'nota' => 'required|numeric|min:0|max:5',
            'comentario_tutor' => 'nullable|string'
        ]);

        $tutor_id = $this->getTutorId($request);
        $seminario = Seminario::where('tutor_id', $tutor_id)->first();

        if (!$seminario) {
            return response()->json(['success' => false, 'message' => 'Seminario no encontrado.'], 404);
        }

        $entrega = SeminarioEntrega::find($id);

        if (!$entrega) {
            return response()->json(['success' => false, 'message' => 'Entrega no encontrada.'], 404);
        }

        // Validar que la actividad pertenezca al seminario de este tutor
        $actividad = SeminarioActividad::where('id', $entrega->actividad_id)
            ->where('seminario_id', $seminario->id)
            ->first();

        if (!$actividad) {
            return response()->json(['success' => false, 'message' => 'Acción no autorizada.'], 403);
        }

        $entrega->update([
            'nota' => $request->nota,
            'comentario_tutor' => $request->comentario_tutor,
            'estado' => 'calificado'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Entrega calificada correctamente.',
            'entrega' => $entrega
        ]);
    }

    // 9. LISTAR RECURSOS
    public function getRecursos(Request $request)
    {
        $tutor_id = $this->getTutorId($request);
        $seminario = Seminario::where('tutor_id', $tutor_id)->first();

        if (!$seminario) {
            return response()->json(['success' => false, 'message' => 'Seminario no encontrado.'], 404);
        }

        $recursos = SeminarioRecurso::where('seminario_id', $seminario->id)
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'recursos' => $recursos
        ]);
    }

    // 10. SUBIR RECURSO (ARCHIVO O LINK EXTERNO)
    public function storeRecurso(Request $request)
    {
        $request->validate([
            'titulo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'tipo' => 'required|in:archivo,enlace',
            'archivo' => 'nullable|required_if:tipo,archivo|file|max:15360', // Máx 15MB
            'url' => 'nullable|required_if:tipo,enlace|string|url|max:2000'
        ], [
            'archivo.required_if' => 'Debe cargar un archivo físico si selecciona tipo Archivo.',
            'url.required_if' => 'Debe ingresar un enlace válido si selecciona tipo Enlace.',
            'url.url' => 'Ingrese un formato de URL válido.',
        ]);

        $tutor_id = $this->getTutorId($request);
        $seminario = Seminario::where('tutor_id', $tutor_id)->first();

        if (!$seminario) {
            return response()->json(['success' => false, 'message' => 'Seminario no encontrado.'], 404);
        }

        $archivo_guardado = null;

        if ($request->tipo === 'archivo' && $request->hasFile('archivo')) {
            $file = $request->file('archivo');
            // Guardamos en el disco 'public' bajo seminarios/recursos
            $nombreArchivo = time() . '_' . $file->getClientOriginalName();
            $file->storeAs('seminarios/recursos', $nombreArchivo, 'public');
            $archivo_guardado = $nombreArchivo;
        }

        $recurso = SeminarioRecurso::create([
            'seminario_id' => $seminario->id,
            'titulo' => $request->titulo,
            'descripcion' => $request->descripcion,
            'tipo' => $request->tipo,
            'archivo' => $archivo_guardado,
            'url' => $request->tipo === 'enlace' ? $request->url : null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Material de apoyo subido exitosamente.',
            'recurso' => $recurso
        ], 201);
    }

    // 11. ELIMINAR RECURSO
    public function destroyRecurso(Request $request, $id)
    {
        $tutor_id = $this->getTutorId($request);
        $seminario = Seminario::where('tutor_id', $tutor_id)->first();

        if (!$seminario) {
            return response()->json(['success' => false, 'message' => 'Seminario no encontrado.'], 404);
        }

        $recurso = SeminarioRecurso::where('id', $id)
            ->where('seminario_id', $seminario->id)
            ->first();

        if (!$recurso) {
            return response()->json(['success' => false, 'message' => 'Material de apoyo no encontrado.'], 404);
        }

        // Borrar el archivo físico si aplica
        if ($recurso->tipo === 'archivo' && $recurso->archivo) {
            Storage::delete('public/seminarios/recursos/' . $recurso->archivo);
        }

        $recurso->delete();

        return response()->json([
            'success' => true,
            'message' => 'Material de apoyo eliminado exitosamente.'
        ]);
    }
}
