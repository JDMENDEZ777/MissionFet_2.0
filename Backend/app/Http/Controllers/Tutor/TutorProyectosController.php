<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TutorProyectosController extends Controller
{
    private function getTutorId(Request $request)
    {
        return $request->user()->id;
    }

    // POST /api/tutor/proyectos/{id}/init-avances
    public function initAvances(Request $request, $id)
    {
        $tutor_id = $this->getTutorId($request);

        $proyecto = DB::table('proyectos')->where('id', $id)->where('tutor_id', $tutor_id)->first();
        if (!$proyecto) {
            return response()->json(['success' => false, 'message' => 'No autorizado'], 403);
        }

        $existing = DB::table('avances_proyecto')->where('proyecto_id', $id)->count();
        if ($existing > 0) {
            return response()->json(['success' => false, 'message' => 'Los avances ya fueron inicializados'], 409);
        }

        $avances = [];
        for ($i = 1; $i <= 4; $i++) {
            $avances[] = [
                'proyecto_id'   => $id,
                'numero_avance' => $i,
                'estado'        => 'pendiente',
                'created_at'    => now(),
                'updated_at'    => now(),
            ];
        }

        DB::table('avances_proyecto')->insert($avances);

        // Actualizar estado del proyecto a en_revision si está propuesto
        if ($proyecto->estado === 'propuesto') {
            DB::table('proyectos')->where('id', $id)->update(['estado' => 'en_revision', 'updated_at' => now()]);
        }

        return response()->json(['success' => true, 'message' => '4 avances inicializados correctamente']);
    }

    // GET /api/tutor/proyectos
    public function index(Request $request)
    {
        $tutor_id = $this->getTutorId($request);

        // Traer proyectos del tutor usando tutor_id directo en la tabla proyectos
        $proyectos = DB::table('proyectos as p')
            ->where('p.tutor_id', $tutor_id)
            ->select('p.*')
            ->orderByDesc('p.created_at')
            ->get();

        // Para cada proyecto, buscar el estudiante asociado (cualquier rol)
        $proyectos = $proyectos->map(function ($p) {
            // Buscar estudiante en estudiantes_proyecto
            $ep = DB::table('estudiantes_proyecto as ep')
                ->join('users as u', 'ep.estudiante_id', '=', 'u.id')
                ->where('ep.proyecto_id', $p->id)
                ->select('u.id as estudiante_id', 'u.name as estudiante_nombre',
                         'u.codigo_estudiante', 'u.email as estudiante_email', 'u.ciclo',
                         'ep.rol_en_proyecto')
                ->first();

            if ($ep) {
                $p->estudiante_id     = $ep->estudiante_id;
                $p->estudiante_nombre = $ep->estudiante_nombre;
                $p->codigo_estudiante = $ep->codigo_estudiante;
                $p->estudiante_email  = $ep->estudiante_email;
                $p->ciclo             = $ep->ciclo;
            } else {
                // Si no hay relación en estudiantes_proyecto, intentar por user_id en proyectos
                // La tabla proyectos no tiene user_id, pero dejamos valores vacíos
                $p->estudiante_id     = null;
                $p->estudiante_nombre = 'Sin asignar';
                $p->codigo_estudiante = '—';
                $p->estudiante_email  = '—';
                $p->ciclo             = '—';
            }

            // Calcular avances aprobados
            $aprobados = DB::table('avances_proyecto')
                ->where('proyecto_id', $p->id)
                ->where('estado', 'aprobado')
                ->count();

            $p->avances_aprobados = $aprobados;
            $p->progreso = round(($aprobados / 4) * 100);

            return $p;
        });

        $total      = $proyectos->count();
        $finalizados = $proyectos->where('estado', 'finalizado')->count();
        $en_curso   = $proyectos->where('estado', 'en_revision')->count();
        $propuestos = $proyectos->where('estado', 'propuesto')->count();

        $pendientes_total = DB::table('avances_proyecto as a')
            ->join('proyectos as p', 'a.proyecto_id', '=', 'p.id')
            ->where('p.tutor_id', $tutor_id)
            ->where('a.estado', 'pendiente')
            ->whereNotNull('a.archivo_entregado')
            ->count();

        return response()->json([
            'success'  => true,
            'proyectos' => $proyectos->values(),
            'stats'    => [
                'total'      => $total,
                'finalizados'=> $finalizados,
                'en_curso'   => $en_curso,
                'propuestos' => $propuestos,
                'pendientes' => $pendientes_total,
            ]
        ]);
    }

    // GET /api/tutor/proyectos/pendientes
    public function getPendientes(Request $request)
    {
        $tutor_id = $this->getTutorId($request);

        $pendientes = DB::table('avances_proyecto as a')
            ->join('proyectos as p', 'a.proyecto_id', '=', 'p.id')
            ->leftJoin('estudiantes_proyecto as ep', 'p.id', '=', 'ep.proyecto_id')
            ->leftJoin('users as u', 'ep.estudiante_id', '=', 'u.id')
            ->where('p.tutor_id', $tutor_id)
            ->where('a.estado', 'pendiente')
            ->whereNotNull('a.archivo_entregado')
            ->select('a.*', 'p.titulo as proyecto_titulo', 'u.name as estudiante_nombre')
            ->orderBy('a.fecha_entrega')
            ->get();

        return response()->json(['success' => true, 'pendientes' => $pendientes]);
    }

    // GET /api/tutor/proyectos/{id}
    public function show(Request $request, $id)
    {
        $tutor_id = $this->getTutorId($request);

        $proyecto = DB::table('proyectos as p')
            ->where('p.id', $id)
            ->where('p.tutor_id', $tutor_id)
            ->first();

        if (!$proyecto) {
            return response()->json(['success' => false, 'message' => 'Proyecto no encontrado'], 404);
        }

        // Buscar estudiante
        $ep = DB::table('estudiantes_proyecto as ep')
            ->join('users as u', 'ep.estudiante_id', '=', 'u.id')
            ->where('ep.proyecto_id', $id)
            ->select('u.id as estudiante_id', 'u.name as estudiante_nombre',
                     'u.codigo_estudiante', 'u.email as estudiante_email', 'u.ciclo')
            ->first();

        if ($ep) {
            $proyecto->estudiante_id     = $ep->estudiante_id;
            $proyecto->estudiante_nombre = $ep->estudiante_nombre;
            $proyecto->codigo_estudiante = $ep->codigo_estudiante;
            $proyecto->estudiante_email  = $ep->estudiante_email;
            $proyecto->ciclo             = $ep->ciclo;
        } else {
            $proyecto->estudiante_id     = null;
            $proyecto->estudiante_nombre = 'Sin asignar';
            $proyecto->codigo_estudiante = '—';
            $proyecto->estudiante_email  = '—';
            $proyecto->ciclo             = '—';
        }

        $avances = DB::table('avances_proyecto')
            ->where('proyecto_id', $id)
            ->orderBy('numero_avance')
            ->get();

        $proyecto->avances = $avances;
        $todos_aprobados   = $avances->count() === 4 && $avances->every(fn($a) => $a->estado === 'aprobado');
        $proyecto->puede_finalizar = $todos_aprobados && $proyecto->estado === 'en_revision';

        return response()->json(['success' => true, 'proyecto' => $proyecto]);
    }

    // POST /api/tutor/proyectos/calificar
    public function calificar(Request $request)
    {
        $tutor_id = $this->getTutorId($request);

        // Sanitizar la nota: reemplazar coma por punto
        if ($request->has('nota') && is_string($request->nota)) {
            $notaSanitizada = str_replace(',', '.', $request->nota);
            $request->merge(['nota' => $notaSanitizada]);
        }

        $request->validate([
            'avance_id'  => 'required|integer',
            'estado'     => 'required|in:aprobado,corregir',
            'nota'       => 'nullable|numeric|min:0|max:5',
            'comentario' => 'nullable|string',
        ], [
            'nota.numeric' => 'La nota debe ser un número válido.',
            'nota.min' => 'La nota mínima es 0.',
            'nota.max' => 'La nota máxima es 5.0 (si pusiste 50, corrígelo a 5.0).',
        ]);

        // Verificar que el avance pertenece a un proyecto del tutor
        $avance = DB::table('avances_proyecto as a')
            ->join('proyectos as p', 'a.proyecto_id', '=', 'p.id')
            ->where('a.id', $request->avance_id)
            ->where('p.tutor_id', $tutor_id)
            ->select('a.*', 'p.id as proyecto_id_val')
            ->first();

        if (!$avance) {
            return response()->json(['success' => false, 'message' => 'No autorizado'], 403);
        }

        DB::table('avances_proyecto')->where('id', $request->avance_id)->update([
            'estado'           => $request->estado,
            'nota'             => $request->nota,
            'comentario_tutor' => $request->comentario,
            'updated_at'       => now(),
        ]);

        if ($request->estado === 'aprobado') {
            $proyecto_id   = $avance->proyecto_id_val;
            $total         = DB::table('avances_proyecto')->where('proyecto_id', $proyecto_id)->count();
            $aprobados     = DB::table('avances_proyecto')->where('proyecto_id', $proyecto_id)->where('estado', 'aprobado')->count();

            if ($total === 4 && $aprobados === 4) {
                DB::table('proyectos')
                    ->where('id', $proyecto_id)
                    ->where('estado', 'en_revision')
                    ->update(['estado' => 'aprobado', 'updated_at' => now()]);
            }
        }

        return response()->json(['success' => true, 'message' => 'Avance calificado']);
    }

    // GET /api/tutor/proyectos/{id}/mensajes
    public function getMensajes(Request $request, $id)
    {
        $tutor_id = $this->getTutorId($request);

        $proyecto = DB::table('proyectos')->where('id', $id)->where('tutor_id', $tutor_id)->first();
        if (!$proyecto) {
            return response()->json(['success' => false, 'message' => 'No autorizado'], 403);
        }

        $mensajes = DB::table('mensajes_chat as m')
            ->join('users as u', 'm.emisor_id', '=', 'u.id')
            ->where('m.proyecto_id', $id)
            ->select('m.*', 'u.name as emisor_nombre')
            ->orderBy('m.fecha_envio')
            ->get();

        return response()->json(['success' => true, 'mensajes' => $mensajes]);
    }

    // POST /api/tutor/proyectos/{id}/mensajes
    public function sendMensaje(Request $request, $id)
    {
        $tutor_id = $this->getTutorId($request);

        $request->validate([
            'receptor_id' => 'required|integer',
            'mensaje'     => 'nullable|string',
        ]);

        $proyecto = DB::table('proyectos')->where('id', $id)->where('tutor_id', $tutor_id)->first();
        if (!$proyecto) {
            return response()->json(['success' => false, 'message' => 'No autorizado'], 403);
        }

        DB::table('mensajes_chat')->insert([
            'proyecto_id' => $id,
            'emisor_id'   => $tutor_id,
            'receptor_id' => $request->receptor_id,
            'mensaje'     => $request->mensaje,
            'leido'       => false,
            'fecha_envio' => now(),
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Mensaje enviado']);
    }

    // POST /api/tutor/proyectos/{id}/subir-acta
    public function subirActa(Request $request, $id)
    {
        $tutor_id = $this->getTutorId($request);

        $request->validate([
            'archivo_acta' => 'required|file|max:10240', // 10MB max (PDF o Imagen)
        ]);

        $proyecto = DB::table('proyectos')->where('id', $id)->where('tutor_id', $tutor_id)->first();
        if (!$proyecto) {
            return response()->json(['success' => false, 'message' => 'No autorizado'], 403);
        }

        $file = $request->file('archivo_acta');
        $extension = $file->getClientOriginalExtension();
        $nombre_base = preg_replace('/[^a-zA-Z0-9_-]/', '_', $proyecto->titulo);
        $nombre_archivo = "acta_" . $proyecto->id . "_" . $nombre_base . "_" . time() . "." . $extension;

        // Guardar archivo en public/uploads/proyectos/actas
        $file->move(public_path('uploads/proyectos/actas'), $nombre_archivo);

        // Actualizar base de datos: estado = 'finalizado', archivo_acta = $nombre_archivo
        DB::table('proyectos')->where('id', $id)->update([
            'estado' => 'finalizado',
            'archivo_acta' => $nombre_archivo,
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Acta de finalización subida correctamente. El proyecto se ha finalizado.',
            'archivo_acta' => $nombre_archivo
        ]);
    }
}
