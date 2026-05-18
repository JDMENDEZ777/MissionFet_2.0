<?php

namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\Seminario;
use App\Models\SeminarioActividad;
use App\Models\SeminarioEntrega;
use App\Models\SeminarioRecurso;

class EstudianteSeminarioController extends Controller
{
    private function getEstudianteId(Request $request)
    {
        return $request->user()->id;
    }

    // 1. OBTENER EL SEMINARIO ACTIVO DONDE EL ESTUDIANTE ESTÁ MATRICULADO
    public function index(Request $request)
    {
        $estudiante_id = $this->getEstudianteId($request);

        // Buscar inscripción del estudiante
        $inscripcion = DB::table('inscripciones_seminario')
            ->where('estudiante_id', $estudiante_id)
            ->first();

        if (!$inscripcion) {
            return response()->json([
                'success' => true,
                'seminario' => null,
                'tutor' => null,
                'stats' => [
                    'actividades_entregadas' => 0,
                    'actividades_totales' => 0,
                    'nota_acumulada' => null
                ]
            ]);
        }

        // Obtener el seminario
        $seminario = Seminario::find($inscripcion->seminario_id);

        if (!$seminario) {
            return response()->json([
                'success' => true,
                'seminario' => null,
                'tutor' => null,
                'stats' => [
                    'actividades_entregadas' => 0,
                    'actividades_totales' => 0,
                    'nota_acumulada' => null
                ]
            ]);
        }

        // Obtener datos del tutor
        $tutor = DB::table('users')
            ->where('id', $seminario->tutor_id)
            ->select('id', 'name as nombre', 'email')
            ->first();

        // Calcular estadísticas del estudiante
        $totales = SeminarioActividad::where('seminario_id', $seminario->id)->count();
        
        $entregadas = SeminarioEntrega::where('estudiante_id', $estudiante_id)
            ->whereIn('actividad_id', function ($query) use ($seminario) {
                $query->select('id')->from('seminario_actividades')->where('seminario_id', $seminario->id);
            })
            ->count();

        // Calcular nota promedio (promedio de entregas calificadas)
        $nota_promedio = DB::table('seminario_entregas as e')
            ->join('seminario_actividades as a', 'e.actividad_id', '=', 'a.id')
            ->where('a.seminario_id', $seminario->id)
            ->where('e.estudiante_id', $estudiante_id)
            ->where('e.estado', 'calificado')
            ->avg('e.nota');

        $nota_acumulada = $nota_promedio !== null ? round($nota_promedio, 1) : null;

        // Actualizar la nota acumulada del estudiante en inscripciones_seminario para consistencia
        if ($nota_acumulada !== null) {
            DB::table('inscripciones_seminario')
                ->where('estudiante_id', $estudiante_id)
                ->where('seminario_id', $seminario->id)
                ->update(['nota' => $nota_acumulada]);
        }

        return response()->json([
            'success' => true,
            'seminario' => $seminario,
            'tutor' => $tutor,
            'stats' => [
                'actividades_entregadas' => $entregadas,
                'actividades_totales' => $totales,
                'nota_acumulada' => $nota_acumulada
            ]
        ]);
    }

    // 2. LISTAR ACTIVIDADES Y EL ESTADO DE ENTREGAS DEL ALUMNO
    public function getActividades(Request $request)
    {
        $estudiante_id = $this->getEstudianteId($request);

        $inscripcion = DB::table('inscripciones_seminario')
            ->where('estudiante_id', $estudiante_id)
            ->first();

        if (!$inscripcion) {
            return response()->json(['success' => false, 'message' => 'No está inscrito en ningún seminario.'], 404);
        }

        // Listar todas las actividades del seminario con la entrega del estudiante
        $actividades = DB::table('seminario_actividades as a')
            ->leftJoin('seminario_entregas as e', function ($join) use ($estudiante_id) {
                $join->on('e.actividad_id', '=', 'a.id')
                     ->where('e.estudiante_id', '=', $estudiante_id);
            })
            ->where('a.seminario_id', $inscripcion->seminario_id)
            ->select(
                'a.id as actividad_id',
                'a.titulo',
                'a.descripcion',
                'a.puntaje as nota_maxima',
                'a.fecha_limite',
                'a.hora_limite',
                'a.permite_entregas_tardias',
                'e.id as entrega_id',
                'e.archivo',
                'e.comentario_estudiante',
                'e.nota',
                'e.comentario_tutor',
                'e.fecha_entrega',
                'e.estado'
            )
            ->orderBy('a.fecha_limite', 'asc')
            ->orderBy('a.hora_limite', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'actividades' => $actividades
        ]);
    }

    // 3. SUBIR/ENTREGAR UNA ACTIVIDAD
    public function storeEntrega(Request $request)
    {
        $request->validate([
            'actividad_id' => 'required|exists:seminario_actividades,id',
            'archivo' => 'required|file|mimes:pdf,doc,docx,zip,rar|max:15360', // Max 15MB
            'comentario_estudiante' => 'nullable|string'
        ], [
            'archivo.required' => 'El archivo físico es obligatorio.',
            'archivo.mimes' => 'Solo se permiten archivos en formato PDF, Word (doc/docx) o comprimidos (zip/rar).',
            'archivo.max' => 'El archivo no debe pesar más de 15MB.'
        ]);

        $estudiante_id = $this->getEstudianteId($request);
        $actividad = SeminarioActividad::find($request->actividad_id);

        // Verificar inscripción del estudiante en el seminario de la actividad
        $inscripcion = DB::table('inscripciones_seminario')
            ->where('estudiante_id', $estudiante_id)
            ->where('seminario_id', $actividad->seminario_id)
            ->first();

        if (!$inscripcion) {
            return response()->json(['success' => false, 'message' => 'No autorizado. No pertenece a este seminario.'], 403);
        }

        // Verificar si ya entregó antes
        $entregaExistente = SeminarioEntrega::where('actividad_id', $request->actividad_id)
            ->where('estudiante_id', $estudiante_id)
            ->first();

        if ($entregaExistente) {
            return response()->json(['success' => false, 'message' => 'Ya has realizado una entrega para esta actividad.'], 400);
        }

        // Evaluar fechas límites
        $fecha_limite = $actividad->fecha_limite;
        $hora_limite = $actividad->hora_limite;
        
        $limite_string = $fecha_limite . ' ' . $hora_limite;
        $fecha_limite_dt = new \DateTime($limite_string);
        $ahora_dt = new \DateTime();

        $es_tardio = $ahora_dt > $fecha_limite_dt;

        if ($es_tardio && !$actividad->permite_entregas_tardias) {
            return response()->json(['success' => false, 'message' => 'La fecha límite de esta actividad ha expirado y no se permiten entregas tardías.'], 400);
        }

        // Guardar archivo físico en el disco 'public'
        $file = $request->file('archivo');
        $nombreArchivo = time() . '_' . $estudiante_id . '_' . $file->getClientOriginalName();
        $file->storeAs('seminarios/entregas', $nombreArchivo, 'public');

        // Crear registro de entrega
        $entrega = SeminarioEntrega::create([
            'actividad_id' => $request->actividad_id,
            'estudiante_id' => $estudiante_id,
            'archivo' => $nombreArchivo,
            'comentario_estudiante' => $request->comentario_estudiante,
            'estado' => $es_tardio ? 'tarde' : 'entregado',
            'fecha_entrega' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => $es_tardio ? 'Entrega cargada exitosamente (fuera de tiempo).' : 'Entrega cargada exitosamente a tiempo.',
            'entrega' => $entrega
        ], 201);
    }

    // 4. LISTAR RECURSOS DISPONIBLES EN EL SEMINARIO
    public function getRecursos(Request $request)
    {
        $estudiante_id = $this->getEstudianteId($request);

        $inscripcion = DB::table('inscripciones_seminario')
            ->where('estudiante_id', $estudiante_id)
            ->first();

        if (!$inscripcion) {
            return response()->json(['success' => false, 'message' => 'No está inscrito en ningún seminario.'], 404);
        }

        $recursos = SeminarioRecurso::where('seminario_id', $inscripcion->seminario_id)
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'recursos' => $recursos
        ]);
    }
}
