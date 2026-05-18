<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\TwilioService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AprobacionController extends Controller
{
    // 1. Obtener Solicitudes Pendientes
    public function index()
    {
        try {
            $solicitudes = DB::table('solicitudes_registro')
                ->where('estado', 'pendiente')
                ->orderBy('created_at', 'desc')
                ->get();
            return response()->json($solicitudes);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // 2. Obtener el Historial de Aprobados/Rechazados
    public function getHistorial()
    {
        try {
            $historial = DB::table('historial_solicitudes')
                ->orderBy('created_at', 'desc')
                ->get();
            return response()->json($historial);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // 3. Aprobar Usuario (Mueve el dato a Users y a Historial)
    public function aprobar($id)
    {
        $solicitud = DB::table('solicitudes_registro')->where('id', $id)->first();
        if (!$solicitud) return response()->json(['message' => 'Solicitud no encontrada'], 404);

        $existe = DB::table('users')->where('email', $solicitud->email)->exists();

        DB::beginTransaction();
        try {
            if (!$existe) {
                DB::table('users')->insert([
                    'name'              => $solicitud->nombre,
                    'email'             => $solicitud->email,
                    'password'          => $solicitud->password,
                    'rol'               => $solicitud->rol,
                    'documento'         => $solicitud->documento,
                    'codigo_estudiante' => $solicitud->codigo_estudiante,
                    'telefono'          => $solicitud->telefono,
                    'opcion_grado'      => $solicitud->opcion_grado,
                    'ciclo'             => $solicitud->ciclo,
                    'estado'            => 'activo',
                    'created_at'        => now(),
                    'updated_at'        => now()
                ]);
            }

            // Insertamos en el historial para que la pestaña no salga vacía
            DB::table('historial_solicitudes')->insert([
                'solicitud_id' => $id,
                'nombre'       => $solicitud->nombre,
                'email'        => $solicitud->email,
                'documento'    => $solicitud->documento,
                'rol'          => $solicitud->rol,
                'estado_final' => 'aprobado',
                'created_at'   => now()
            ]);

            // Borramos de pendientes para que no se duplique
            DB::table('solicitudes_registro')->where('id', $id)->delete();

            DB::commit();

            // Enviar notificación por WhatsApp si tiene teléfono registrado
            if (!empty($solicitud->telefono)) {
                $twilio = new TwilioService();
                $mensaje = "¡Hola {$solicitud->nombre}! 🎉\n"
                    . "Tu cuenta en la plataforma Misión FET fue aprobada.\n"
                    . "Usuario: {$solicitud->email}";
                $twilio->enviarWhatsApp($solicitud->telefono, $mensaje);
            }

            return response()->json(['message' => 'Usuario aprobado y registrado en historial']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // 4. Rechazar Usuario
    public function rechazar($id)
    {
        $solicitud = DB::table('solicitudes_registro')->where('id', $id)->first();
        if (!$solicitud) return response()->json(['message' => 'No encontrada'], 404);

        try {
            DB::table('historial_solicitudes')->insert([
                'solicitud_id' => $id,
                'nombre'       => $solicitud->nombre,
                'email'        => $solicitud->email,
                'documento'    => $solicitud->documento,
                'rol'          => $solicitud->rol,
                'estado_final' => 'rechazado',
                'created_at'   => now()
            ]);

            DB::table('solicitudes_registro')->where('id', $id)->delete();
            return response()->json(['message' => 'Solicitud rechazada']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}