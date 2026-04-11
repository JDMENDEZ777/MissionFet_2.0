<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash; // <--- NUEVO: Para encriptar contraseñas
use App\Models\User;
use App\Models\SolicitudRegistro; // <--- NUEVO: Para usar la tabla de solicitudes

class AuthController extends Controller
{
    // --- TU LOGIN DE SIEMPRE (No se toca) ---
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials)) {
            /** @var \App\Models\User $user */
            $user = Auth::user();
            
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'status' => 'success',
                'message' => 'Login exitoso',
                'access_token' => $token,
                'user' => $user
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Credenciales incorrectas'
        ], 401);
    }

    // --- NUEVA FUNCIÓN: REGISTRO ---
    public function register(Request $request) 
    {
        try {
            // 1. Validación estricta
            $request->validate([
                'nombre' => 'required|string|max:255',
                // Validamos que sea correo FET y que no esté repetido en users ni en solicitudes
                'email' => [
                    'required', 
                    'email', 
                    'unique:solicitudes_registro,email', 
                    'unique:users,email', 
                    'regex:/@fet\.edu\.co$/i'
                ],
                'documento' => 'required|unique:solicitudes_registro,documento|unique:users,documento',
                'password' => 'required|min:6',
                'rol' => 'required|in:estudiante,tutor'
            ], [
                'email.regex' => 'El correo debe ser institucional (@fet.edu.co)',
                'email.unique' => 'Este correo ya tiene una solicitud o ya está registrado.',
                'documento.unique' => 'Este número de documento ya está en el sistema.'
            ]);

            // 2. Guardar en la tabla de solicitudes_registro
            $solicitud = SolicitudRegistro::create([
                'nombre' => $request->nombre,
                'email' => $request->email,
                'password' => Hash::make($request->password), // Encriptamos la clave
                'rol' => $request->rol,
                'documento' => $request->documento,
                'codigo_estudiante' => $request->codigo_estudiante,
                'codigo_institucional' => $request->codigo_institucional,
                'opcion_grado' => $request->opcion_grado,
                'ciclo' => $request->ciclo,
                'telefono' => $request->rol === 'estudiante' ? $request->telefono : $request->telefono_tutor,
                'nombre_proyecto' => $request->nombre_proyecto,
                'nombre_empresa' => $request->nombre_empresa,
                'estado' => 'pendiente' // El admin deberá cambiar esto luego
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Solicitud enviada con éxito. Espera la aprobación del administrador.'
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            // Si la validación falla (ej: correo no es @fet), devolvemos el error exacto
            return response()->json([
                'status' => 'error',
                'message' => $e->validator->errors()->first()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error en el servidor: ' . $e->getMessage()
            ], 500);
        }
    }
}