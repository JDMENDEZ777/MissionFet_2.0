<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SolicitudRegistro;
use App\Models\User;
use App\Models\Estudiante;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AprobacionController extends Controller
{
    public function aprobar($id)
    {
        // Usamos una transacción para garantizar integridad total
        return DB::transaction(function () use ($id) {
            $solicitud = SolicitudRegistro::findOrFail($id);

            // 1. Crear el usuario en la tabla 'users'
            $user = User::create([
                'nombre' => $solicitud->nombre,
                'email' => $solicitud->email,
                'password' => $solicitud->password, // Ya viene cifrada desde el registro
                'rol' => $solicitud->rol,
            ]);

            // 2. Si es estudiante, crear el registro en 'estudiantes'
            if ($solicitud->rol === 'estudiante') {
                Estudiante::create([
                    'user_id' => $user->id,
                    'codigo_estudiante' => $solicitud->codigo_estudiante,
                    'opcion_grado' => $solicitud->opcion_grado,
                ]);
            }

            // 3. Marcar como aprobada y borrar la solicitud (o cambiar su estado)
            $solicitud->update(['estado' => 'aprobado']);
            $solicitud->delete(); 

            return response()->json(['message' => 'Usuario aprobado con éxito'], 200);
        });
    }
}