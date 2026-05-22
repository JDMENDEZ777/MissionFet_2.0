<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProyectoController extends Controller
{
    // 1. DATOS PARA EL FORMULARIO
    public function getFormData()
    {
        $tutores = DB::table('users')
            ->whereRaw('LOWER(rol) = ?', ['tutor'])
            ->select('id', 'name as nombre')
            ->get();

        $asignados = DB::table('estudiantes_proyecto')->pluck('estudiante_id')->toArray();

        $queryLibres = DB::table('users')
            ->whereRaw('LOWER(rol) = ?', ['estudiante'])
            ->whereRaw('LOWER(opcion_grado) = ?', ['proyecto']);
        if (count($asignados) > 0) $queryLibres->whereNotIn('id', $asignados);
        $estudiantes = $queryLibres->select('id', 'name as nombre', 'email', 'codigo_estudiante', 'opcion_grado')->get();

        // Todos los estudiantes de proyecto (para el modal editar)
        $todosEstudiantes = DB::table('users')
            ->whereRaw('LOWER(rol) = ?', ['estudiante'])
            ->whereRaw('LOWER(opcion_grado) = ?', ['proyecto'])
            ->select('id', 'name as nombre', 'email', 'codigo_estudiante', 'opcion_grado')
            ->get();

        return response()->json([
            'tutores'          => $tutores,
            'estudiantes'      => $estudiantes,
            'todos_estudiantes' => $todosEstudiantes,
        ]);
    }

    // 2. LISTAR PROYECTOS CON ESTUDIANTES ASIGNADOS
    public function index()
    {
        $proyectos = DB::table('proyectos as p')
            ->leftJoin('users as u', 'p.tutor_id', '=', 'u.id')
            ->select('p.*', 'u.name as tutor_nombre')
            ->orderBy('p.id', 'desc')
            ->get();

        foreach ($proyectos as $proyecto) {
            $proyecto->num_estudiantes = DB::table('estudiantes_proyecto')
                ->where('proyecto_id', $proyecto->id)->count();

            $proyecto->estudiantes = DB::table('estudiantes_proyecto as ep')
                ->join('users as u', 'ep.estudiante_id', '=', 'u.id')
                ->where('ep.proyecto_id', $proyecto->id)
                ->select('ep.estudiante_id', 'u.name as estudiante_nombre', 'u.email as estudiante_email', 'ep.rol_en_proyecto')
                ->orderByRaw("ep.rol_en_proyecto = 'líder' DESC")
                ->get();
        }

        return response()->json($proyectos);
    }

    // 3. CREAR PROYECTO
    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            $archivo_nombre = null;
            if ($request->hasFile('archivo_proyecto')) {
                $file = $request->file('archivo_proyecto');
                $originalName = $file->getClientOriginalName();
                $nombreArchivo = preg_replace('/[^A-Za-z0-9.\-_]/', '_', $originalName);
                $file->storeAs('proyectos', $nombreArchivo, 'public');
                $archivo_nombre = $nombreArchivo;
            }

            $proyecto_id = DB::table('proyectos')->insertGetId([
                'titulo'           => $request->titulo,
                'descripcion'      => $request->descripcion,
                'archivo_proyecto' => $archivo_nombre,
                'estado'           => 'propuesto',
                'tipo'             => 'proyecto',
                'tutor_id'         => $request->tutor_id ?: null,
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);

            $estudiantes = json_decode($request->estudiantes);
            if (is_array($estudiantes) && count($estudiantes) > 0) {
                foreach ($estudiantes as $index => $estudiante_id) {
                    DB::table('estudiantes_proyecto')->insert([
                        'proyecto_id'     => $proyecto_id,
                        'estudiante_id'   => $estudiante_id,
                        'rol_en_proyecto' => ($index === 0) ? 'líder' : 'miembro',
                        'created_at'      => now(),
                        'updated_at'      => now(),
                    ]);
                }
            }

            DB::commit();
            return response()->json(['message' => 'Proyecto creado exitosamente'], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    // 4. ACTUALIZAR PROYECTO (POST con _method=PUT simulado via FormData)
    public function update(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $updateData = [
                'titulo'      => $request->titulo,
                'descripcion' => $request->descripcion,
                'estado'      => $request->estado,
                'tutor_id'    => $request->tutor_id ?: null,
                'updated_at'  => now(),
            ];

            if ($request->hasFile('archivo_proyecto')) {
                // Eliminar archivo anterior
                $old = DB::table('proyectos')->where('id', $id)->value('archivo_proyecto');
                if ($old && Storage::disk('public')->exists("proyectos/{$old}")) {
                    Storage::disk('public')->delete("proyectos/{$old}");
                }
                $file = $request->file('archivo_proyecto');
                $originalName = $file->getClientOriginalName();
                $nombreArchivo = preg_replace('/[^A-Za-z0-9.\-_]/', '_', $originalName);
                $file->storeAs('proyectos', $nombreArchivo, 'public');
                $updateData['archivo_proyecto'] = $nombreArchivo;
            }

            DB::table('proyectos')->where('id', $id)->update($updateData);

            // Re-asignar estudiantes
            DB::table('estudiantes_proyecto')->where('proyecto_id', $id)->delete();
            $estudiantes = json_decode($request->estudiantes);
            if (is_array($estudiantes) && count($estudiantes) > 0) {
                foreach ($estudiantes as $index => $estudiante_id) {
                    DB::table('estudiantes_proyecto')->insert([
                        'proyecto_id'     => $id,
                        'estudiante_id'   => $estudiante_id,
                        'rol_en_proyecto' => ($index === 0) ? 'líder' : 'miembro',
                        'created_at'      => now(),
                        'updated_at'      => now(),
                    ]);
                }
            }

            DB::commit();
            return response()->json(['message' => 'Proyecto actualizado exitosamente']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    // 5. ELIMINAR PROYECTO
    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $old = DB::table('proyectos')->where('id', $id)->value('archivo_proyecto');
            if ($old && Storage::exists("public/proyectos/{$old}")) {
                Storage::delete("public/proyectos/{$old}");
            }
            DB::table('estudiantes_proyecto')->where('proyecto_id', $id)->delete();
            DB::table('proyectos')->where('id', $id)->delete();
            DB::commit();
            return response()->json(['message' => 'Proyecto eliminado exitosamente']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }
}