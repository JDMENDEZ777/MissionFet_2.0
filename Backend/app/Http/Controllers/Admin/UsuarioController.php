<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UsuarioController extends Controller
{
    // 1. OBTENER TODOS LOS USUARIOS
    public function index()
    {
        // Traemos todos los usuarios ordenados por los más recientes
        $usuarios = User::orderBy('created_at', 'desc')->get();
        return response()->json($usuarios);
    }

    // 2. ACTUALIZAR UN USUARIO
    public function update(Request $request, $id)
    {
        try {
            $usuario = User::findOrFail($id);

            // Actualizamos los campos. Usamos 'name' porque así se llama en tu BD.
            $usuario->update([
                'name' => $request->name ?? $request->nombre,
                'email' => $request->email,
                'rol' => $request->rol,
                'documento' => $request->documento,
                'codigo_estudiante' => $request->codigo_estudiante,
                'telefono' => $request->telefono,
                'opcion_grado' => $request->opcion_grado,
                'ciclo' => $request->ciclo,
                'estado' => $request->estado ?? 'activo', // Si tu tabla no tiene 'estado', Laravel lo ignorará si no está en el $fillable
            ]);

            return response()->json(['message' => 'Usuario actualizado correctamente', 'usuario' => $usuario]);
            
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al actualizar: ' . $e->getMessage()], 500);
        }
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