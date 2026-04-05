<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\SolicitudRegistro;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
// ELIMINAMOS EL IMPORT DE TWILIO POR AHORA

class AprobacionController extends Controller
{
    public function index()
    {
        try {
            return response()->json([
                'solicitudes' => SolicitudRegistro::all(),
                'historial' => DB::table('historial_solicitudes')->get()
            ]);
        } catch (\Exception $e) {
            // Si algo falla, le decimos exactamente qué fue a React
            return response()->json(['message' => 'Error de BD: ' . $e->getMessage()], 500);
        }
    }

    public function aprobar($id)
    {
        return DB::transaction(function () use ($id) {
            $solicitud = SolicitudRegistro::findOrFail($id);

            // Crear el usuario real
            $user = User::create([
                'name' => $solicitud->nombre,
                'email' => $solicitud->email,
                'password' => $solicitud->password,
                'rol' => $solicitud->rol,
                'documento' => $solicitud->documento,
            ]);

            // Guardar en historial
            DB::table('historial_solicitudes')->insert([
                'solicitud_id' => $id,
                'nombre' => $solicitud->nombre,
                'email' => $solicitud->email,
                'documento' => $solicitud->documento,
                'rol' => $solicitud->rol,
                'estado_final' => 'aprobado',
                'created_at' => now(),
            ]);

            // Llamamos a la función, pero está inofensiva por ahora
            $this->enviarNotificacionWhatsapp($solicitud);

            $solicitud->delete();

            return response()->json(['message' => 'Usuario aprobado y cuenta creada']);
        });
    }

    public function rechazar($id)
    {
        $solicitud = SolicitudRegistro::findOrFail($id);

        DB::table('historial_solicitudes')->insert([
            'solicitud_id' => $id,
            'nombre' => $solicitud->nombre,
            'email' => $solicitud->email,
            'documento' => $solicitud->documento,
            'rol' => $solicitud->rol,
            'estado_final' => 'rechazado',
            'created_at' => now(),
        ]);

        $solicitud->delete();

        return response()->json(['message' => 'Solicitud rechazada']);
    }

    private function enviarNotificacionWhatsapp($solicitud)
    {
        // TODO: Configurar Twilio más adelante
        // Por ahora solo dejamos un registro de que el sistema "intentó" enviarlo
        Log::info("Simulación: Mensaje de WhatsApp listo para enviar a {$solicitud->nombre}");
    }
}