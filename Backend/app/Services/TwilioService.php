<?php

namespace App\Services;

use Twilio\Rest\Client;
use Illuminate\Support\Facades\Log;

class TwilioService
{
    protected Client $client;
    protected string $from;

    public function __construct()
    {
        $this->client = new Client(
            config('services.twilio.sid'),
            config('services.twilio.token')
        );
        $this->from = config('services.twilio.whatsapp_from');
    }

    /**
     * Envía un mensaje de WhatsApp al número indicado.
     *
     * @param  string  $telefonoRaw  Número tal como viene de la BD (ej. "3235169745")
     * @param  string  $mensaje
     * @return void
     */
    public function enviarWhatsApp(string $telefonoRaw, string $mensaje): void
    {
        try {
            // Limpiar y formatear al estándar internacional colombiano (+57)
            $telefono = preg_replace('/\D/', '', $telefonoRaw);

            // Si ya tiene código de país, no lo duplicamos
            if (!str_starts_with($telefono, '57')) {
                $telefono = '57' . ltrim($telefono, '0');
            }
            $whatsappTo = 'whatsapp:+' . $telefono;

            $this->client->messages->create(
                $whatsappTo,
                [
                    'from' => $this->from,
                    'body' => $mensaje,
                ]
            );

            Log::info("[WhatsApp] Mensaje enviado a {$whatsappTo}");
        } catch (\Exception $e) {
            // No interrumpimos el flujo principal si falla el envío
            Log::error("[WhatsApp] Error al enviar mensaje: " . $e->getMessage());
        }
    }
}
