<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UsuarioController extends Controller
{
    // 1. OBTENER TODOS LOS USUARIOS
    
public function index()
    {
        // 1. Usamos 'users' y filtramos al admin (ignorando mayúsculas)
        $usuarios = DB::table('users')
            ->whereRaw('LOWER(rol) != ?', ['admin'])
            ->whereRaw('LOWER(rol) != ?', ['administrador'])
            ->select(
                'id',
                'name as nombre', // Disfrazamos 'name' como 'nombre' para que React lo entienda
                'email',
                'rol',
                'documento',
                'codigo_estudiante',
                'telefono',
                'opcion_grado',
                'ciclo',
                'estado'
            )
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($usuarios);
    }
    // 2. ACTUALIZAR UN USUARIO
   public function update(Request $request, $id)
    {
        // Usamos DB::table para ser 100% directos
        DB::table('users')->where('id', $id)->update([
            'name'              => $request->nombre,  // Recibimos 'nombre' del React y lo guardamos en 'name'
            'email'             => $request->email,
            'rol'               => $request->rol,
            'documento'         => $request->documento,
            'codigo_estudiante' => $request->codigo_estudiante,
            'telefono'          => $request->telefono,
            'opcion_grado'      => $request->opcion_grado,
            'ciclo'             => $request->ciclo,
            'estado'            => $request->estado,
            'updated_at'        => now()
        ]);

        return response()->json(['message' => '¡Usuario actualizado con éxito!']);
    }
    // 3. ELIMINAR UN USUARIO
    public function destroy($id)
    {
        try {
            $usuario = User::findOrFail($id);
            $usuario->delete();

            return response()->json(['message' => 'Usuario eliminado correctamente']);
            
        } catch (\Illuminate\Database\QueryException $e) {
            // Este error salta si intentas borrar a alguien que ya tiene proyectos asignados
            return response()->json(['message' => 'No se puede eliminar: El usuario tiene datos relacionados.'], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al eliminar el usuario'], 500);
        }
    }
}