<?php

namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EstudianteProyectoController extends Controller
{
    private function getEstudianteId(Request $request)
    {
        return $request->user()->id;
    }

    // GET /api/estudiante/proyecto
    public function index(Request $request)
    {
        $estudiante_id = $this->getEstudianteId($request);

        // Obtener proyecto
        $proyecto = DB::table('proyectos as p')
            ->join('estudiantes_proyecto as ep', 'p.id', '=', 'ep.proyecto_id')
            ->leftJoin('users as u', 'p.tutor_id', '=', 'u.id')
            ->where('ep.estudiante_id', $estudiante_id)
            ->select('p.*', 'u.name as tutor_nombre')
            ->first();

        if (!$proyecto) {
            return response()->json([
                'success' => false, 
                'message' => 'No tienes un proyecto registrado. Por favor, comunícate con administración.'
            ]);
        }

        // Obtener avances
        $avances = DB::table('avances_proyecto')
            ->where('proyecto_id', $proyecto->id)
            ->orderBy('numero_avance')
            ->get();

        // Notificaciones (comentarios por corregir)
        $notificaciones = DB::table('avances_proyecto')
            ->where('proyecto_id', $proyecto->id)
            ->whereNotNull('comentario_tutor')
            ->where('estado', 'corregir')
            ->count();

        return response()->json([
            'success' => true,
            'proyecto' => $proyecto,
            'avances' => $avances,
            'notificaciones' => $notificaciones
        ]);
    }

    // POST /api/estudiante/proyecto/avances
    public function subirAvance(Request $request)
    {
        $estudiante_id = $this->getEstudianteId($request);
        
        $proyecto = DB::table('proyectos as p')
            ->join('estudiantes_proyecto as ep', 'p.id', '=', 'ep.proyecto_id')
            ->where('ep.estudiante_id', $estudiante_id)
            ->select('p.id', 'p.titulo')
            ->first();

        if (!$proyecto) {
            return response()->json(['success' => false, 'message' => 'No autorizado'], 403);
        }

        $request->validate([
            'numero_avance' => 'required|integer',
            'archivos_avance' => 'required|array|min:1|max:5',
            'archivos_avance.*' => 'file|max:5120', // 5MB cada uno
            'comentario_estudiante' => 'nullable|string'
        ]);

        $numero_avance = $request->numero_avance;
        $files = $request->file('archivos_avance');
        $comentario = $request->comentario_estudiante;

        // Sanitizar nombre de archivo
        $nombre_base = preg_replace('/[^a-zA-Z0-9_-]/', '_', $proyecto->titulo);
        
        if (count($files) === 1) {
            // Un solo archivo, guardarlo con su extensión original
            $file = $files[0];
            $extension = $file->getClientOriginalExtension();
            $nombre_archivo = $proyecto->id . "_avance_" . $numero_avance . "_" . $nombre_base . "_" . time() . "." . $extension;
            $file->move(public_path('uploads/proyectos/entregas'), $nombre_archivo);
        } else {
            // Varios archivos, crear un ZIP
            $nombre_archivo = $proyecto->id . "_avance_" . $numero_avance . "_" . $nombre_base . "_" . time() . ".zip";
            $zipPath = public_path('uploads/proyectos/entregas/' . $nombre_archivo);
            
            $zip = new \ZipArchive();
            if ($zip->open($zipPath, \ZipArchive::CREATE) === TRUE) {
                foreach ($files as $file) {
                    $originalName = $file->getClientOriginalName();
                    // Limpiar nombre original para evitar problemas dentro del zip
                    $cleanName = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $originalName);
                    $zip->addFile($file->getRealPath(), $cleanName);
                }
                $zip->close();
            }
        }

        $avance_existente = DB::table('avances_proyecto')
            ->where('proyecto_id', $proyecto->id)
            ->where('numero_avance', $numero_avance)
            ->first();

        if ($avance_existente) {
            if ($avance_existente->estado === 'corregir' || $avance_existente->estado === 'pendiente') {
                DB::table('avances_proyecto')
                    ->where('id', $avance_existente->id)
                    ->update([
                        'archivo_entregado' => $nombre_archivo,
                        'comentario_estudiante' => $comentario,
                        'estado' => 'pendiente',
                        'fecha_entrega' => now(),
                        // 'comentario_tutor' => null, // Opcional limpiar
                        // 'nota' => null
                    ]);
            } else {
                return response()->json(['success' => false, 'message' => 'Este avance ya fue entregado y no requiere corrección.']);
            }
        } else {
            DB::table('avances_proyecto')->insert([
                'proyecto_id' => $proyecto->id,
                'numero_avance' => $numero_avance,
                'archivo_entregado' => $nombre_archivo,
                'comentario_estudiante' => $comentario,
                'estado' => 'pendiente',
                'fecha_entrega' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json(['success' => true, 'message' => 'Avance entregado correctamente.']);
    }

    // GET /api/estudiante/proyecto/mensajes
    public function getMensajes(Request $request)
    {
        $estudiante_id = $this->getEstudianteId($request);
        
        $proyecto = DB::table('proyectos as p')
            ->join('estudiantes_proyecto as ep', 'p.id', '=', 'ep.proyecto_id')
            ->where('ep.estudiante_id', $estudiante_id)
            ->select('p.id')
            ->first();

        if (!$proyecto) return response()->json(['success' => false, 'message' => 'Sin proyecto']);

        $mensajes = DB::table('mensajes_chat')
            ->where('proyecto_id', $proyecto->id)
            ->orderBy('fecha_envio', 'asc')
            ->get();

        return response()->json(['success' => true, 'mensajes' => $mensajes]);
    }

    // POST /api/estudiante/proyecto/mensajes
    public function sendMensaje(Request $request)
    {
        $estudiante_id = $this->getEstudianteId($request);

        $proyecto = DB::table('proyectos as p')
            ->join('estudiantes_proyecto as ep', 'p.id', '=', 'ep.proyecto_id')
            ->where('ep.estudiante_id', $estudiante_id)
            ->select('p.id', 'p.tutor_id')
            ->first();

        if (!$proyecto || !$proyecto->tutor_id) {
            return response()->json(['success' => false, 'message' => 'No autorizado o sin tutor asignado'], 403);
        }

        $request->validate([
            'mensaje' => 'required_without:archivo|string|nullable',
            'archivo' => 'nullable|file|max:10240' // 10MB
        ]);

        $archivo_nombre = null;
        if ($request->hasFile('archivo')) {
            $file = $request->file('archivo');
            $extension = $file->getClientOriginalExtension();
            $nombre_original = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $sanitized = preg_replace('/[^a-zA-Z0-9._-]/', '_', $nombre_original);
            $archivo_nombre = $proyecto->id . "_" . time() . "_" . $sanitized . "." . $extension;
            $file->move(public_path('uploads/proyectos/chat'), $archivo_nombre);
        }

        DB::table('mensajes_chat')->insert([
            'proyecto_id' => $proyecto->id,
            'emisor_id' => $estudiante_id,
            'receptor_id' => $proyecto->tutor_id,
            'mensaje' => $request->mensaje,
            'archivo' => $archivo_nombre,
            'fecha_envio' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json(['success' => true, 'message' => 'Mensaje enviado']);
    }
}
