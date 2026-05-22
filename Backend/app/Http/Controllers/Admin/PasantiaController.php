<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PasantiaController extends Controller
{
    // 1. OBTENER DATOS PARA EL FORMULARIO
    public function getFormData()
    {
        // Tutores
        $tutores = DB::table('users')
            ->whereRaw('LOWER(rol) = ?', ['tutor'])
            ->select('id', 'name as nombre')
            ->get();

        // Estudiantes asignados a pasantías activas
        $asignados = DB::table('pasantias')
            ->whereNotIn('estado', ['finalizada', 'rechazada'])
            ->pluck('estudiante_id')
            ->toArray();

        // Estudiantes disponibles para pasantía
        $queryLibres = DB::table('users')
            ->whereRaw('LOWER(rol) = ?', ['estudiante'])
            ->whereRaw('LOWER(opcion_grado) = ?', ['pasantia']);
            
        if (count($asignados) > 0) {
            $queryLibres->whereNotIn('id', $asignados);
        }
        
        $estudiantes = $queryLibres->select(
            'id', 'name as nombre', 'email', 'codigo_estudiante', 'documento', 'telefono', 'nombre_empresa', 'ciclo'
        )->get();

        // Todos los estudiantes de pasantía (para el modal editar)
        $todosEstudiantes = DB::table('users')
            ->whereRaw('LOWER(rol) = ?', ['estudiante'])
            ->whereRaw('LOWER(opcion_grado) = ?', ['pasantia'])
            ->select('id', 'name as nombre', 'email', 'codigo_estudiante', 'documento', 'telefono', 'nombre_empresa', 'ciclo')
            ->get();

        return response()->json([
            'tutores'           => $tutores,
            'estudiantes'       => $estudiantes,
            'todos_estudiantes' => $todosEstudiantes,
        ]);
    }

    // 2. LISTAR PASANTÍAS
    public function index()
    {
        $pasantias = DB::table('pasantias as p')
            ->leftJoin('users as e', 'p.estudiante_id', '=', 'e.id')
            ->leftJoin('users as t', 'p.tutor_id', '=', 't.id')
            ->select(
                'p.*',
                'e.name as estudiante_nombre',
                'e.email as estudiante_email',
                'e.documento as estudiante_documento',
                'e.codigo_estudiante as codigo_estudiante',
                't.name as tutor_nombre',
                't.email as tutor_email'
            )
            ->orderBy('p.id', 'desc')
            ->get();

        return response()->json($pasantias);
    }

    // 3. CREAR PASANTÍA
    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            $archivo_nombre = null;
            if ($request->hasFile('archivo_documento')) {
                $file = $request->file('archivo_documento');
                $nombreArchivo = time() . '_' . $file->getClientOriginalName();
                $file->storeAs('public/pasantias', $nombreArchivo);
                $archivo_nombre = $nombreArchivo;
            }

            DB::table('pasantias')->insert([
                'estudiante_id'       => $request->estudiante_id,
                'user_id'             => $request->estudiante_id, // columna legacy V1
                'cargo'               => '',                       // columna legacy V1
                'titulo'              => $request->titulo,
                'descripcion'         => $request->descripcion,
                'empresa'             => $request->empresa ?? '',
                'direccion_empresa'   => $request->direccion_empresa,
                'contacto_empresa'    => $request->contacto_empresa,
                'supervisor_empresa'  => $request->supervisor_empresa,
                'telefono_supervisor' => $request->telefono_supervisor,
                'fecha_inicio'        => $request->fecha_inicio ?: null,
                'fecha_fin'           => $request->fecha_fin ?: null,
                'estado'              => 'pendiente',
                'tutor_id'            => $request->tutor_id ?: null,
                'archivo_documento'   => $archivo_nombre,
                'fecha_creacion'      => now(),
            ]);

            DB::commit();
            return response()->json(['message' => 'Pasantía creada exitosamente'], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    // 4. ACTUALIZAR PASANTÍA (POST por FormData)
    public function update(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $updateData = [
                'titulo'              => $request->titulo,
                'descripcion'         => $request->descripcion,
                'empresa'             => $request->empresa,
                'direccion_empresa'   => $request->direccion_empresa,
                'contacto_empresa'    => $request->contacto_empresa,
                'supervisor_empresa'  => $request->supervisor_empresa,
                'telefono_supervisor' => $request->telefono_supervisor,
                'fecha_inicio'        => $request->fecha_inicio ?: null,
                'fecha_fin'           => $request->fecha_fin ?: null,
                'estado'              => $request->estado,
                'tutor_id'            => $request->tutor_id ?: null,
            ];

            if ($request->hasFile('archivo_documento')) {
                // Eliminar archivo anterior
                $old = DB::table('pasantias')->where('id', $id)->value('archivo_documento');
                if ($old && Storage::disk('public')->exists("pasantias/{$old}")) {
                    Storage::disk('public')->delete("pasantias/{$old}");
                }
                $file = $request->file('archivo_documento');
                $nombreArchivo = time() . '_' . $file->getClientOriginalName();
                $file->storeAs('pasantias', $nombreArchivo, 'public');
                $updateData['archivo_documento'] = $nombreArchivo;
            }

            DB::table('pasantias')->where('id', $id)->update($updateData);

            DB::commit();
            return response()->json(['message' => 'Pasantía actualizada exitosamente']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    // 5. ELIMINAR PASANTÍA
    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $old = DB::table('pasantias')->where('id', $id)->value('archivo_documento');
            if ($old && Storage::exists("public/pasantias/{$old}")) {
                Storage::delete("public/pasantias/{$old}");
            }
            
            DB::table('pasantias')->where('id', $id)->delete();
            DB::commit();
            return response()->json(['message' => 'Pasantía eliminada exitosamente']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }
}
